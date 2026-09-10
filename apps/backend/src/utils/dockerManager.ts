import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";
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

export class DockerManager {
  private docker: Docker;
  private activeContainers: Map<string, ContainerInfo>;
  private db: DatabaseService;
  private networkName: string;

  constructor() {
    this.docker = new Docker();
    this.activeContainers = new Map();
    this.db = new DatabaseService();
    this.networkName = process.env.DOCKER_NETWORK || "secure-browser-net";
    this.ensureNetwork();
    this.cleanupOrphanedContainers();
  }

  private async ensureNetwork(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks();
      const exists = networks.some((n) => n.Name === this.networkName);
      if (!exists) {
        await this.docker.createNetwork({
          Name: this.networkName,
          Driver: "bridge",
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
    userAgent?: string
  ): Promise<CreateContainerResponse> {
    const containerId = uuidv4();
    const isMobile = isMobileUserAgent(userAgent || "");
    const chromeUserAgent = getChromeUserAgent(isMobile);
    const viewport = getViewport(isMobile);

    try {
      await this.ensureNetwork();

      // Configure host port bindings (enabled by default for host dev, e.g., local macOS)
      const enableHostPortBindings = process.env.ENABLE_HOST_PORT_BINDINGS !== "false";
      const portBindings = enableHostPortBindings
        ? {
            "6080/tcp": [{ HostPort: "0" }],
            "5900/tcp": [{ HostPort: "0" }],
          }
        : {};

      const container = await this.docker.createContainer({
        Image: process.env.BROWSER_IMAGE || "vnc-browser-chrome:latest",
        name: `vnc-browser-${containerId}`,
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          CpuShares: 512, // Half CPU
          NetworkMode: this.networkName,
          PortBindings: portBindings,
          AutoRemove: true, // automatically remove container when stopped
        },
        Env: [
          `TARGET_URL=${url}`,
          `USER_AGENT=${chromeUserAgent}`,
          `IS_MOBILE=${isMobile ? "true" : "false"}`,
          `VIEWPORT_WIDTH=${viewport.width}`,
          `VIEWPORT_HEIGHT=${viewport.height}`,
        ],
        StopTimeout: 10,
      });

      await container.start();

      // Wait for container initialization
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const containerInfo = await container.inspect();
      const networkSettings = containerInfo?.NetworkSettings;
      
      // Determine internal container IP on the bridge network
      const containerIp =
        networkSettings?.Networks?.[this.networkName]?.IPAddress ||
        networkSettings?.IPAddress ||
        "";

      // Mapped host port if enabled, else default internal port 6080
      const hostPort =
        networkSettings?.Ports?.["6080/tcp"]?.[0]?.HostPort || "6080";

      // Create database session
      const session = await this.db.createSession(containerId, url, hostPort);
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

      const timeoutId = setTimeout(() => {
        this.stopContainer(containerId);
      }, SESSION_TIMEOUT_MS);

      this.activeContainers.set(containerId, {
        container,
        containerIp,
        vncPort: hostPort,
        url,
        createdAt: new Date(),
        timeoutId,
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
      throw error;
    }
  }

  async stopContainer(containerId: string): Promise<boolean> {
    const containerInfo = this.activeContainers.get(containerId);
    if (!containerInfo) {
      return false;
    }

    try {
      if (containerInfo.timeoutId) {
        clearTimeout(containerInfo.timeoutId);
      }

      await containerInfo.container.stop();

      const session = await this.db.getSession(containerId);
      if (session) {
        await this.db.endSession(containerId);
        await this.db.logAction(
          session.id,
          LogAction.CONTAINER_STOPPED,
          "Container stopped by user or timeout"
        );
      }

      this.activeContainers.delete(containerId);
      return true;
    } catch (error) {
      console.error("Error stopping container:", error);
      return false;
    }
  }

  getContainerInfo(containerId: string): ContainerInfo | undefined {
    return this.activeContainers.get(containerId);
  }

  listActiveContainers(): ContainerSummary[] {
    return Array.from(this.activeContainers.entries()).map(([id, info]) => ({
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
