import dotenv from "dotenv";
dotenv.config({ path: [".env", "../../.env"] });

import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import containerRoutes, { containerController } from "./routes/container";
import { DatabaseService } from "./services/databaseService";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/secure_browser";
}

const app = express();
const PORT = process.env.PORT || 3001;

const initializeDatabase = async () => {
  try {
    const db = new DatabaseService();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// Security headers - allow iframing the VNC viewer from frontend
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // accommodate WebSocket & asset polling
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Dynamic Reverse Proxy for noVNC HTTP assets and WebSocket streaming
const vncProxy = createProxyMiddleware({
  target: "http://127.0.0.1:6080",
  changeOrigin: true,
  ws: true,
  router: async (req) => {
    const deny = (status = 403, message = "Unauthorized access to session") => {
      const res = (req as any).res;
      if (res && !res.headersSent) {
        res.status(status).json({ success: false, error: message });
      } else if (req.socket && !req.socket.destroyed) {
        req.socket.write(`HTTP/1.1 ${status} Forbidden\r\n\r\n`);
        req.socket.destroy();
      }
      const err = new Error(message);
      (err as any).statusCode = status;
      throw err;
    };

    const rawUrl = (req as any).originalUrl || req.url || "";
    const match = rawUrl.match(/\/api\/containers\/([a-f0-9-]+)\/vnc/);
    if (!match) {
      return deny();
    }

    const containerId = match[1];
    let token: string | undefined;
    let ticket: string | undefined;
    try {
      const parsedUrl = new URL(rawUrl, "http://localhost");
      ticket = parsedUrl.searchParams.get("ticket") || undefined;
      token = parsedUrl.searchParams.get("token") || undefined;
    } catch {}
    if (!token) {
      token = (req as any).headers?.["x-guest-token"] as string | undefined;
    }

    const dockerManager = containerController.getDockerManager();
    const containerInfo =
      (ticket && dockerManager.getContainerInfoByTicket(ticket, containerId)) ||
      (token && dockerManager.getContainerInfo(containerId, token)) ||
      undefined;

    if (!containerInfo) {
      return deny();
    }

    // Route via mapped host port (decoupled from sessions network)
    const vncHost =
      containerInfo?.vncHost ||
      process.env.VNC_PROXY_HOST ||
      process.env.VNC_BIND_HOST ||
      "127.0.0.1";
    if (containerInfo?.vncPort && containerInfo.vncPort !== "6080") {
      return `http://${vncHost}:${containerInfo.vncPort}`;
    }

    // Fallback if running on a shared bridge or custom configuration
    if (containerInfo?.containerIp) {
      return `http://${containerInfo.containerIp}:6080`;
    }

    return `http://${vncHost}:${containerInfo?.vncPort || 6080}`;
  },
  pathRewrite: (path) => {
    // Rewrite /api/containers/:id/vnc/vnc_lite.html -> /vnc_lite.html
    return path.replace(/\/api\/containers\/[a-f0-9-]+\/vnc/, "") || "/";
  },
});

// Block any access originating from inside browser session containers (global middleware)
app.use((req: Request, res: Response, next: NextFunction) => {
  const remoteIp = req.socket.remoteAddress;
  if (remoteIp) {
    const dockerManager = containerController.getDockerManager();
    if (dockerManager.isSessionIp(remoteIp)) {
      res
        .status(403)
        .json({ success: false, error: "Access denied from browser session" });
      return;
    }
  }
  next();
});

// Mount the VNC proxy before express.json() with authorization check
app.use(
  "/api/containers/:containerId/vnc",
  (req: Request, res: Response, next: NextFunction) => {
    const containerId = String(
      req.params?.containerId ||
      req.originalUrl?.match(/\/api\/containers\/([a-f0-9-]+)\/vnc/)?.[1] ||
      ""
    );
    const ticket = typeof req.query.ticket === "string" ? req.query.ticket : undefined;
    const token =
      (typeof req.query.token === "string" ? req.query.token : undefined) ||
      (typeof req.headers["x-guest-token"] === "string"
        ? req.headers["x-guest-token"]
        : undefined);
    const dockerManager = containerController.getDockerManager();
    const containerInfo =
      (ticket && dockerManager.getContainerInfoByTicket(ticket, containerId)) ||
      (token && dockerManager.getContainerInfo(containerId, token)) ||
      undefined;

    if (!containerInfo) {
      res
        .status(403)
        .json({ success: false, error: "Unauthorized access to session" });
      return;
    }
    next();
  },
  vncProxy
);

app.use(express.json());

app.use("/api/containers", containerRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return;
  }
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err.stack);
  }
  res.status(statusCode).json({ success: false, error: err.message || "Something went wrong!" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

const server = http.createServer(app);

// Handle WebSocket upgrade for noVNC streaming with authorization check
server.on("upgrade", (req, socket, head) => {
  const remoteIp = req.socket.remoteAddress;
  if (remoteIp) {
    const dockerManager = containerController.getDockerManager();
    if (dockerManager.isSessionIp(remoteIp)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
  }

  const match = req.url?.match(/^\/api\/containers\/([a-f0-9-]+)\/vnc/);
  if (!match) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const containerId = match[1];
  let token: string | undefined;
  let ticket: string | undefined;
  try {
    const parsedUrl = new URL(req.url!, "http://localhost");
    ticket = parsedUrl.searchParams.get("ticket") || undefined;
    token = parsedUrl.searchParams.get("token") || undefined;
  } catch {}
  if (!token) {
    token = (req.headers["x-guest-token"] as string) || undefined;
  }

  const dockerManager = containerController.getDockerManager();
  const containerInfo =
    (ticket && dockerManager.getContainerInfoByTicket(ticket, containerId)) ||
    (token && dockerManager.getContainerInfo(containerId, token)) ||
    undefined;

  if (!containerInfo) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  if (ticket) {
    dockerManager.invalidateTicket(ticket);
  }

  vncProxy.upgrade(req, socket as any, head);
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
export { app, server };
