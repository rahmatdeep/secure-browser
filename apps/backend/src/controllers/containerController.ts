import { Request, Response } from "express";
import { DockerManager } from "../utils/dockerManager";
import { CreateContainerRequest, ApiResponse } from "@secure-browser/shared";

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

      try {
        new URL(url);
      } catch (error) {
        res.status(400).json({ success: false, error: "Invalid URL format" });
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
        res.json({
          success: true,
          data: {
            containerId,
            url: containerInfo.url,
            vncPort: containerInfo.vncPort,
            vncUrl: `/api/containers/${containerId}/vnc/vnc_lite.html`,
            createdAt: containerInfo.createdAt,
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

  async listActiveContainers(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const guestToken =
        (req.headers["x-guest-token"] as string) ||
        (req.query.token as string) ||
        undefined;
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
