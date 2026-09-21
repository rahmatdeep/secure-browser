import { Request, Response } from "express";
import dns from "dns";
import net from "net";
import { DockerManager, EgressGuardUnavailableError } from "../utils/dockerManager";
import { CreateContainerRequest, ApiResponse } from "@secure-browser/shared";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b, c] = parts;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local / APIPA / Cloud metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Broadcast)
  if (a >= 224) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const clean = ip.toLowerCase().replace(/^\[|\]$/g, "");

  // Unpack IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1
  if (clean.startsWith("::ffff:")) {
    const rest = clean.slice(7);
    if (rest.includes(".")) {
      return isPrivateIPv4(rest);
    }
    const hexParts = rest.split(":");
    if (hexParts.length === 2) {
      const high = parseInt(hexParts[0], 16);
      const low = parseInt(hexParts[1], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const b1 = (high >> 8) & 0xff;
        const b2 = high & 0xff;
        const b3 = (low >> 8) & 0xff;
        const b4 = low & 0xff;
        return isPrivateIPv4(`${b1}.${b2}.${b3}.${b4}`);
      }
    }
  }

  // Loopback / unspecified
  if (clean === "::" || clean === "::1") return true;

  let hextets: string[];
  if (clean.includes("::")) {
    const [head, tail] = clean.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const missing = 8 - (headParts.length + tailParts.length);
    hextets = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  } else {
    hextets = clean.split(":");
  }
  if (hextets.length !== 8) return true;

  const firstWord = parseInt(hextets[0], 16);
  if (isNaN(firstWord)) return true;

  // ::1 / ::
  if (hextets.slice(0, 7).every((h) => parseInt(h, 16) === 0)) {
    const lastWord = parseInt(hextets[7], 16);
    if (lastWord === 0 || lastWord === 1) return true;
  }

  // fe80::/10 (Link-local)
  if ((firstWord & 0xffc0) === 0xfe80) return true;

  // fc00::/7 (Unique local)
  if ((firstWord & 0xfe00) === 0xfc00) return true;

  // ff00::/8 (Multicast)
  if ((firstWord & 0xff00) === 0xff00) return true;

  // 2001:db8::/32 (Documentation)
  if (firstWord === 0x2001 && parseInt(hextets[1], 16) === 0xdb8) return true;

  // 2002::/16 (6to4 - check embedded IPv4)
  if (firstWord === 0x2002) {
    const w1 = parseInt(hextets[1], 16);
    const w2 = parseInt(hextets[2], 16);
    const b1 = (w1 >> 8) & 0xff;
    const b2 = w1 & 0xff;
    const b3 = (w2 >> 8) & 0xff;
    const b4 = w2 & 0xff;
    return isPrivateIPv4(`${b1}.${b2}.${b3}.${b4}`);
  }

  return false;
}

function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  const clean = ip.replace(/^\[|\]$/g, "");
  if (net.isIP(clean) === 6) return isPrivateIPv6(clean);
  return true;
}

/**
 * Ingress URL validator for session container creation.
 * 
 * Boundary Note on DNS Rebinding:
 * validateTargetUrl performs create-time ingress filtering against private IP ranges and internal service names.
 * However, a malicious external DNS server could perform DNS rebinding (returning a public IP at creation time
 * and subsequently resolving to an internal IP when Chrome connects).
 * 
 * Ingress validation alone cannot prevent time-of-check to time-of-use (TOCTOU) DNS rebinding.
 * Runtime protection is therefore strictly enforced through a multi-layered defense-in-depth model:
 * 1. Runtime in-container PAC script (--proxy-pac-url): Dynamic dnsResolve() checks before every outbound HTTP/HTTPS request inside Chrome.
 * 2. Host kernel firewall (DOCKER-USER chain): Unconditionally drops packets from the container bridge to RFC 1918 / link-local / metadata subnets.
 * 3. Network segregation: Browser containers run in secure-browser-sessions with enable_icc: false and separate network namespaces from backend/database.
 */
export async function validateTargetUrl(
  url: string
): Promise<{ valid: boolean; error?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Only allow HTTP and HTTPS
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();
  const cleanHost = hostname.replace(/^\[|\]$/g, "");

  const blockedHostnames = new Set([
    "localhost",
    "backend",
    "frontend",
    "postgres",
    "db",
    "redis",
    "secure-browser-backend",
    "secure-browser-frontend",
    "secure-browser-postgres",
  ]);

  if (blockedHostnames.has(cleanHost)) {
    return { valid: false, error: "URLs targeting internal services are not allowed" };
  }

  // If the host is an IP literal, validate directly
  if (net.isIP(cleanHost) !== 0) {
    if (isBlockedIp(cleanHost)) {
      return { valid: false, error: "URLs targeting private/internal networks are not allowed" };
    }
    return { valid: true };
  }

  // Domain name: resolve via DNS to catch DNS rebinding and internal resolutions
  try {
    const records = await dns.promises.lookup(cleanHost, { all: true });
    for (const record of records) {
      if (isBlockedIp(record.address)) {
        return { valid: false, error: "URLs resolving to private/internal networks are not allowed" };
      }
    }
  } catch {
    return { valid: false, error: "Unable to resolve hostname" };
  }

  return { valid: true };
}

export class ContainerController {
  private dockerManager: DockerManager;

  constructor() {
    this.dockerManager = new DockerManager();
  }

  async createContainer(
    req: Request<{}, ApiResponse, CreateContainerRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { url } = req.body;
      const userAgent = req.get("User-Agent") || "";
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        req.body.guestToken ||
        undefined;

      if (!url) {
        res.status(400).json({ success: false, error: "URL is required" });
        return;
      }

      const urlValidation = await validateTargetUrl(url);
      if (!urlValidation.valid) {
        res.status(400).json({ success: false, error: urlValidation.error });
        return;
      }

      const containerInfo = await this.dockerManager.createContainer(
        url,
        userAgent,
        guestToken
      );

      res.json({
        success: true,
        data: containerInfo,
      });
    } catch (error) {
      console.error("Error creating container:", error);
      if (error instanceof EgressGuardUnavailableError) {
        res.status(503).json({ success: false, error: error.message });
        return;
      }
      res
        .status(500)
        .json({
          success: false,
          error: (error as Error)?.message || "Failed to create container",
        });
    }
  }

  async stopContainer(
    req: Request<{ containerId: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { containerId } = req.params;
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        (req.query.token as string) ||
        undefined;

      const success = await this.dockerManager.stopContainer(containerId, guestToken);

      if (success) {
        res.json({ success: true, message: "Container stopped" });
      } else {
        res.status(404).json({ success: false, error: "Container not found" });
      }
    } catch (error) {
      console.error("Error stopping container:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to stop container" });
    }
  }

  async getContainerInfo(
    req: Request<{ containerId: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { containerId } = req.params;
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        (req.query.token as string) ||
        undefined;

      const containerInfo = this.dockerManager.getContainerInfo(containerId, guestToken);

      if (containerInfo) {
        let vncTicket: string | undefined;
        if (guestToken) {
          try {
            vncTicket = this.dockerManager.createVncTicket(containerId, guestToken);
          } catch {}
        }

        res.json({
          success: true,
          data: {
            containerId,
            url: containerInfo.url,
            vncPort: containerInfo.vncPort,
            vncUrl: `/api/containers/${containerId}/vnc/vnc_lite.html`,
            createdAt: containerInfo.createdAt,
            vncPassword: containerInfo.vncPassword,
            vncTicket,
          },
        });
      } else {
        res.status(404).json({ success: false, error: "Container not found" });
      }
    } catch (error) {
      console.error("Error getting container info:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get container info" });
    }
  }

  async createVncTicket(
    req: Request<{ containerId: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { containerId } = req.params;
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        (req.query.token as string) ||
        undefined;

      if (!guestToken) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      const containerInfo = this.dockerManager.getContainerInfo(containerId, guestToken);
      if (!containerInfo) {
        res.status(404).json({ success: false, error: "Container not found" });
        return;
      }

      const ticket = this.dockerManager.createVncTicket(containerId, guestToken);
      res.json({
        success: true,
        data: {
          containerId,
          vncTicket: ticket,
        },
      });
    } catch (error) {
      console.error("Error creating VNC ticket:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create VNC ticket" });
    }
  }

  async listActiveContainers(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        (req.query.token as string) ||
        undefined;

      if (!guestToken) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      const containers = this.dockerManager.listActiveContainers(guestToken);
      res.json({
        success: true,
        data: containers,
      });
    } catch (error) {
      console.error("Error listing containers:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to list containers" });
    }
  }

  getDockerManager(): DockerManager {
    return this.dockerManager;
  }
}
