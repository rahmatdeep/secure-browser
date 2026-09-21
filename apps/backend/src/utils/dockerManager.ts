import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import net from "net";
import dns from "dns";
import {
  ContainerInfo,
  CreateContainerResponse,
  ContainerSummary,
  isMobileUserAgent,
  getChromeUserAgent,
  getViewport,
  SESSION_TIMEOUT_MS,
} from "@secure-browser/shared";
import { DatabaseService } from "../services/databaseService";
import { LogAction } from "@prisma/client";

function generateVncPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(8);
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

interface VncTicket {
  containerId: string;
  guestToken: string;
  createdAt: Date;
  expiresAt: Date;
}

export class EgressGuardUnavailableError extends Error {
  constructor(message = "Session egress guard is not running; refusing to start a browser session") {
    super(message);
    this.name = "EgressGuardUnavailableError";
  }
}

export class DockerManager {
  private docker: Docker;
  private activeContainers: Map<string, ContainerInfo>;
  private vncTickets: Map<string, VncTicket>;
  private db: DatabaseService;
  private networkName: string;

  constructor() {
    this.docker = new Docker();
    this.activeContainers = new Map();
    this.vncTickets = new Map();
    this.db = new DatabaseService();
    this.networkName = process.env.SESSION_NETWORK || process.env.DOCKER_NETWORK || "secure-browser-sessions";
    this.ensureNetwork();
    this.cleanupOrphanedContainers();
  }

  // True when the egress-guard container (label sb.egress-guard=true) is running and healthy.
  async isEgressGuardActive(): Promise<boolean> {
    try {
      const guards = await this.docker.listContainers({
        filters: { label: ["sb.egress-guard=true"], status: ["running"] },
      });
      return guards.some(
        (c) => /\(healthy\)/.test(c.Status || "") && !/unhealthy/.test(c.Status || "")
      );
    } catch {
      return false;
    }
  }

  isSessionIp(ip: string): boolean {
    const clean = ip.replace(/^::ffff:/, "");
    for (const info of this.activeContainers.values()) {
      if (info.containerIp && info.containerIp === clean) {
        return true;
      }
    }
    return false;
  }

  private async resolveToIp(host: string): Promise<string> {
    if (net.isIP(host)) {
      return host;
    }
    try {
      const res = await dns.promises.lookup(host, { family: 4 });
      return res.address;
    } catch (err) {
      console.warn(
        `Failed to resolve bind host "${host}" to an IP address:`,
        (err as Error)?.message || err
      );
      throw new Error(
        `Failed to resolve bind host "${host}" to an IP address: ${(err as Error)?.message || err}`
      );
    }
  }

  private async getSessionsNetworkGateway(): Promise<string | undefined> {
    try {
      const net = this.docker.getNetwork(this.networkName);
      const info = await net.inspect();
      return info?.IPAM?.Config?.[0]?.Gateway;
    } catch (err) {
      console.warn(
        `Failed to inspect network gateway for ${this.networkName}:`,
        (err as Error)?.message || err
      );
      return undefined;
    }
  }

  private async ensureNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks();
      const exists = networks.some((n) => n.Name === this.networkName);
      if (!exists) {
        await this.docker.createNetwork({
          Name: this.networkName,
          Driver: "bridge",
          Options: {
            "com.docker.network.bridge.enable_icc": "false",
          },
          Labels: {
            "com.docker.compose.network": this.networkName,
          },
        });
        console.log(`Created Docker network: ${this.networkName}`);
      }
    } catch (error) {
      // If Docker daemon is unavailable (e.g. during certain test environments), log and continue
      console.warn(`Could not verify/create network ${this.networkName}:`, error);
    }
  }

  async createContainer(
    url: string,
    userAgent?: string,
    guestToken?: string
  ): Promise<CreateContainerResponse> {
    if (process.env.EGRESS_GUARD_REQUIRED === "true" && !(await this.isEgressGuardActive())) {
      throw new EgressGuardUnavailableError();
    }

    const containerId = uuidv4();
    const token = guestToken || uuidv4();
    const isMobile = isMobileUserAgent(userAgent || "");
    const chromeUserAgent = getChromeUserAgent(isMobile);
    const viewport = getViewport(isMobile);
    const vncPassword = generateVncPassword();

    try {
      await this.ensureNetwork();

      // Configure host port bindings (enabled by default so decoupled backend can reach sessions)
      const enableHostPortBindings = process.env.ENABLE_HOST_PORT_BINDINGS !== "false";
      let bindIp = "127.0.0.1";
      let portBindings: Record<string, Array<{ HostIp?: string; HostPort: string }>> = {};
      if (enableHostPortBindings) {
        const rawBindHost =
          process.env.VNC_BIND_HOST ||
          (await this.getSessionsNetworkGateway()) ||
          "127.0.0.1";
        bindIp = await this.resolveToIp(rawBindHost);
        portBindings = {
          "6080/tcp": [{ HostIp: bindIp, HostPort: "0" }],
        };
      }
      const vncHost = process.env.VNC_PROXY_HOST || bindIp;

      const container = await this.docker.createContainer({
        Image: process.env.BROWSER_IMAGE || "vnc-browser-chrome:latest",
        name: `vnc-browser-${containerId}`,
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          CpuShares: 512, // Half CPU
          NetworkMode: this.networkName,
          PortBindings: portBindings,
          AutoRemove: true, // automatically remove container when stopped
          Dns: ["1.1.1.1", "8.8.8.8"],
          ExtraHosts: [
            "backend:127.0.0.1",
            "secure-browser-backend:127.0.0.1",
            "frontend:127.0.0.1",
            "secure-browser-frontend:127.0.0.1",
            "postgres:127.0.0.1",
            "secure-browser-postgres:127.0.0.1",
          ],
        },
        Env: [
          `TARGET_URL=${url}`,
          `USER_AGENT=${chromeUserAgent}`,
          `IS_MOBILE=${isMobile ? "true" : "false"}`,
          `VIEWPORT_WIDTH=${viewport.width}`,
          `VIEWPORT_HEIGHT=${viewport.height}`,
          `VNC_PASSWORD=${vncPassword}`,
        ],
        StopTimeout: 10,
      });

      await container.start();

      // Wait for container initialization
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const containerInfo = await container.inspect();
      if (!containerInfo?.State?.Running) {
        let errorDetails = "";
        try {
          const logBuffer = await container.logs({ stdout: true, stderr: true, tail: 50 });
          errorDetails = logBuffer.toString("utf-8");
        } catch {}
        throw new Error(
          `Browser container failed to start (exit code ${containerInfo?.State?.ExitCode ?? "unknown"}): ${errorDetails || "container exited prematurely"}`
        );
      }

      const networkSettings = containerInfo?.NetworkSettings;
      
      // Determine internal container IP on the bridge network
      const containerIp =
        networkSettings?.Networks?.[this.networkName]?.IPAddress ||
        networkSettings?.IPAddress ||
        "";

      // Mapped host port if enabled, else default internal port 6080
      const hostPort =
        networkSettings?.Ports?.["6080/tcp"]?.[0]?.HostPort || "6080";

      // Attempt database audit logging (resilient: failures do not block the active session)
      try {
        const session = await this.db.createSession(containerId, url, hostPort, token);
        await this.db.logAction(
          session.id,
          LogAction.CONTAINER_CREATED,
          `Container created for URL: ${url} (${isMobile ? "Mobile" : "Desktop"} mode)`
        );
        await this.db.logAction(
          session.id,
          LogAction.CONTAINER_STARTED,
          `Container running on network ${this.networkName} (IP: ${containerIp})`
        );
      } catch (dbError) {
        console.warn(
          "Database audit logging unavailable (continuing session):",
          (dbError as Error)?.message || dbError
        );
      }

      const timeoutId = setTimeout(() => {
        this.stopContainer(containerId);
      }, SESSION_TIMEOUT_MS);

      this.activeContainers.set(containerId, {
        container,
        containerIp,
        vncPort: hostPort,
        vncHost: vncHost,
        guestToken: token,
        url,
        createdAt: new Date(),
        timeoutId,
        vncPassword,
      });

      // Unified path-based proxy URL (no exposed random ports!)
      const vncUrl = `/api/containers/${containerId}/vnc/vnc_lite.html`;

      return {
        containerId,
        vncPort: hostPort,
        vncUrl,
      };
    } catch (error) {
      console.error("Error creating container:", error);
      // Attempt cleanup if container was created
      try {
        const orphan = this.docker.getContainer(`vnc-browser-${containerId}`);
        await orphan.remove({ force: true });
      } catch {
        // Ignore cleanup error
      }
      throw error;
    }
  }

  async stopContainer(containerId: string, guestToken?: string): Promise<boolean> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      return false;
    }

    if (!guestToken || containerInfo.guestToken !== guestToken) {
      return false;
    }

    try {
      if (containerInfo.timeoutId) {
        clearTimeout(containerInfo.timeoutId);
      }

      await containerInfo.container.stop();

      try {
        const session = await this.db.getSession(containerId);
        if (session) {
          await this.db.endSession(containerId);
          await this.db.logAction(
            session.id,
            LogAction.CONTAINER_STOPPED,
            "Container stopped by user or timeout"
          );
        }
      } catch (dbError) {
        console.warn("Database audit logging error during session stop:", dbError);
      }

      this.activeContainers.delete(containerId);

      // Clean up any tickets issued for this container
      for (const [ticket, entry] of this.vncTickets.entries()) {
        if (entry.containerId === containerId) {
          this.vncTickets.delete(ticket);
        }
      }

      return true;
    } catch (error) {
      console.error("Error stopping container:", error);
      return false;
    }
  }

  createVncTicket(containerId: string, guestToken: string): string {
    const info = this.activeContainers.get(containerId);
    if (!info || info.guestToken !== guestToken) {
      throw new Error("Unauthorized to create ticket for this container");
    }

    this.cleanExpiredTickets();

    const ticket = crypto.randomBytes(24).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 1000); // 30s validity

    this.vncTickets.set(ticket, {
      containerId,
      guestToken,
      createdAt: now,
      expiresAt,
    });

    return ticket;
  }

  validateTicket(ticket: string, containerId: string): boolean {
    const entry = this.vncTickets.get(ticket);
    if (!entry) {
      return false;
    }

    if (entry.containerId !== containerId) {
      return false;
    }

    if (new Date() > entry.expiresAt) {
      this.vncTickets.delete(ticket);
      return false;
    }

    return true;
  }

  invalidateTicket(ticket: string): void {
    this.vncTickets.delete(ticket);
  }

  validateAndRedeemTicket(ticket: string, containerId: string): boolean {
    return this.validateTicket(ticket, containerId);
  }

  getContainerInfoByTicket(ticket: string, containerId: string): ContainerInfo | undefined {
    if (!this.validateTicket(ticket, containerId)) {
      return undefined;
    }
    return this.activeContainers.get(containerId);
  }

  private cleanExpiredTickets(): void {
    const now = new Date();
    for (const [ticket, entry] of this.vncTickets.entries()) {
      if (now > entry.expiresAt) {
        this.vncTickets.delete(ticket);
      }
    }
  }

  getContainerInfo(containerId: string, guestToken?: string): ContainerInfo | undefined {
    const info = this.activeContainers.get(containerId);
    if (!info) {
      return undefined;
    }
    if (!guestToken || info.guestToken !== guestToken) {
      return undefined;
    }
    return info;
  }

  listActiveContainers(guestToken: string): ContainerSummary[] {
    const entries = Array.from(this.activeContainers.entries())
      .filter(([_, info]) => info.guestToken === guestToken);
    return entries.map(([id, info]) => ({
      containerId: id,
      url: info.url,
      vncPort: info.vncPort,
      createdAt: info.createdAt,
    }));
  }

  private async cleanupOrphanedContainers() {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          name: ["vnc-browser-"],
        },
      });

      for (const container of containers) {
        const containerObj = this.docker.getContainer(container.Id);
        await containerObj.remove({ force: true });
        console.log(`Cleaned up orphaned container: ${container.Names[0]}`);
      }
    } catch (error) {
      console.error("Container cleanup failed:", error);
    }
  }
}
