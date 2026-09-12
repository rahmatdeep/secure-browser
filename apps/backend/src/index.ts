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
    const rawUrl = (req as any).originalUrl || req.url || "";
    const match = rawUrl.match(/\/api\/containers\/([a-f0-9-]+)\/vnc/);
    if (match) {
      const containerId = match[1];
      const dockerManager = containerController.getDockerManager();
      const containerInfo = dockerManager.getContainerInfo(containerId);

      // 1. If mapped host port is present (e.g. host dev on macOS), use localhost:<hostPort>
      if (containerInfo?.vncPort && containerInfo.vncPort !== "6080") {
        return `http://127.0.0.1:${containerInfo.vncPort}`;
      }

      // 2. If container IP is known on bridge network (inside Docker), use it directly
      if (containerInfo?.containerIp) {
        return `http://${containerInfo.containerIp}:6080`;
      }

      // 3. Default to Docker internal DNS name on secure-browser-net
      return `http://vnc-browser-${containerId}:6080`;
    }
    return undefined;
  },
  pathRewrite: (path) => {
    // Rewrite /api/containers/:id/vnc/vnc_lite.html -> /vnc_lite.html
    return path.replace(/\/api\/containers\/[a-f0-9-]+\/vnc/, "") || "/";
  },
});

// Mount the VNC proxy before express.json() so streams/payloads are untouched
app.use("/api/containers/:containerId/vnc", vncProxy);

app.use(express.json());

app.use("/api/containers", containerRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

const server = http.createServer(app);

// Handle WebSocket upgrade for noVNC streaming
server.on("upgrade", (req, socket, head) => {
  if (req.url?.includes("/vnc/")) {
    vncProxy.upgrade(req, socket as any, head);
  }
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
export { app, server };
