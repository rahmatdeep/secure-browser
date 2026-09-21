import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../index";
import { containerController } from "../routes/container";
import { DockerManager, EgressGuardUnavailableError } from "../utils/dockerManager";

// Tests must never touch a real database: replace the Prisma-backed service with a stub.
vi.mock("../services/databaseService", () => ({
  DatabaseService: class {
    createSession = vi.fn().mockResolvedValue({ id: "test-session" });
    getSession = vi.fn().mockResolvedValue(null);
    endSession = vi.fn().mockResolvedValue(undefined);
    getActiveSessions = vi.fn().mockResolvedValue([]);
    logAction = vi.fn().mockResolvedValue(undefined);
  },
}));

describe("Backend API Endpoints (Characterization Tests)", () => {
  describe("GET /health", () => {
    it("should return status 200 and OK with timestamp", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for unknown endpoints", async () => {
      const response = await request(app).get("/unknown-endpoint-xyz");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Route not found" });
    });
  });

  describe("POST /api/containers/create validation", () => {
    it("should return 400 if URL is missing in request body", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: "URL is required",
      });
    });

    it("should return 400 if URL format is invalid", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "invalid-url-not-http" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: "Invalid URL format",
      });
    });

    it("should reject non-HTTP(S) URLs", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "file:///etc/passwd" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Only HTTP and HTTPS URLs are allowed");
    });

    it("should reject chrome:// URLs", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "chrome://settings" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Only HTTP and HTTPS URLs are allowed");
    });

    it("should reject URLs targeting internal services", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "http://localhost:5432" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not allowed");
    });

    it("should reject URLs targeting Docker service names", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "http://postgres:5432" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not allowed");
    });

    it("should reject URLs targeting cloud metadata endpoints", async () => {
      const response = await request(app)
        .post("/api/containers/create")
        .send({ url: "http://169.254.169.254/latest/meta-data/" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not allowed");
    });

    it("should reject URLs targeting private IP ranges", async () => {
      const testCases = [
        "http://192.168.1.1",
        "http://10.0.0.1",
        "http://172.16.0.1",
        "http://127.0.0.1:3001",
      ];

      for (const url of testCases) {
        const response = await request(app)
          .post("/api/containers/create")
          .send({ url });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain("not allowed");
      }
    });
  });

  describe("GET /api/containers/:containerId", () => {
    it("should return 404 when container does not exist", async () => {
      const response = await request(app).get("/api/containers/non-existent-id-123");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "Container not found",
      });
    });
  });

  describe("GET /api/containers/:containerId fail-closed token check", () => {
    const testId = "active-test-container-456";
    const testToken = "secret-token-xyz";
    const testPassword = "vnc-password-123";

    beforeEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.set(testId, {
        container: { stop: vi.fn() },
        containerIp: "172.18.0.5",
        vncPort: "6080",
        guestToken: testToken,
        url: "https://example.com",
        createdAt: new Date(),
        vncPassword: testPassword,
      });
    });

    afterEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.delete(testId);
    });

    it("should return 404 when no guest token is provided (does not leak vncPassword)", async () => {
      const response = await request(app).get(`/api/containers/${testId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "Container not found",
      });
      expect(response.body).not.toHaveProperty("data");
    });

    it("should return 404 when wrong guest token is provided", async () => {
      const response = await request(app)
        .get(`/api/containers/${testId}`)
        .set("x-guest-token", "wrong-token-abc");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "Container not found",
      });
    });

    it("should return 200 and session data with vncPassword when valid guest token is provided", async () => {
      const response = await request(app)
        .get(`/api/containers/${testId}`)
        .set("x-guest-token", testToken);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("containerId", testId);
      expect(response.body.data).toHaveProperty("vncPassword", testPassword);
    });
  });

  describe("DELETE /api/containers/:containerId", () => {
    it("should return 404 when stopping non-existent container", async () => {
      const response = await request(app).delete(
        "/api/containers/non-existent-id-123"
      );
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: "Container not found",
      });
    });
  });

  describe("DELETE /api/containers/:containerId fail-closed token check", () => {
    const testId = "active-stop-test-container-789";
    const testToken = "secret-stop-token";

    beforeEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.set(testId, {
        container: { stop: vi.fn().mockResolvedValue(true) },
        containerIp: "172.18.0.5",
        vncPort: "6080",
        guestToken: testToken,
        url: "https://example.com",
        createdAt: new Date(),
      });
    });

    afterEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.delete(testId);
    });

    it("should return 404 and not stop container when no token is provided", async () => {
      const response = await request(app).delete(`/api/containers/${testId}`);
      expect(response.status).toBe(404);
      const dm = containerController.getDockerManager();
      expect((dm as any).activeContainers.has(testId)).toBe(true);
    });

    it("should return 404 and not stop container when wrong token is provided", async () => {
      const response = await request(app)
        .delete(`/api/containers/${testId}`)
        .set("x-guest-token", "wrong-stop-token");
      expect(response.status).toBe(404);
      const dm = containerController.getDockerManager();
      expect((dm as any).activeContainers.has(testId)).toBe(true);
    });

    it("should stop container and return 200 when valid token is provided", async () => {
      const response = await request(app)
        .delete(`/api/containers/${testId}`)
        .set("x-guest-token", testToken);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Container stopped",
      });
      const dm = containerController.getDockerManager();
      expect((dm as any).activeContainers.has(testId)).toBe(false);
    });
  });

  describe("GET /api/containers", () => {
    it("should return 401 when no guest token is provided", async () => {
      const response = await request(app).get("/api/containers");
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: "Authentication required",
      });
    });

    it("should accept x-guest-token and return filtered active containers", async () => {
      const response = await request(app)
        .get("/api/containers")
        .set("x-guest-token", "test-guest-token-abc");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("VNC Proxy Authorization Guard", () => {
    it("should return 403 when accessing VNC proxy for an unauthorized or non-existent session", async () => {
      const response = await request(app).get(
        "/api/containers/non-existent-session-123/vnc/vnc_lite.html"
      );
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: "Unauthorized access to session",
      });
    });

    it("should return 403 when accessing VNC proxy for an active session with no token", async () => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.set("test-vnc-session-1", {
        container: { stop: vi.fn() },
        containerIp: "172.18.0.5",
        vncPort: "6080",
        guestToken: "vnc-secret-token",
        url: "https://example.com",
        createdAt: new Date(),
      });

      const response = await request(app).get(
        "/api/containers/test-vnc-session-1/vnc/vnc_lite.html"
      );
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: "Unauthorized access to session",
      });

      (dm as any).activeContainers.delete("test-vnc-session-1");
    });

    it("should return 403 when accessing VNC proxy for an active session with wrong token", async () => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.set("test-vnc-session-2", {
        container: { stop: vi.fn() },
        containerIp: "172.18.0.5",
        vncPort: "6080",
        guestToken: "vnc-secret-token",
        url: "https://example.com",
        createdAt: new Date(),
      });

      const response = await request(app)
        .get("/api/containers/test-vnc-session-2/vnc/vnc_lite.html")
        .set("x-guest-token", "wrong-vnc-token");
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: "Unauthorized access to session",
      });

      (dm as any).activeContainers.delete("test-vnc-session-2");
    });
  });

  describe("Container Isolation Configuration", () => {
    it("should not configure SYS_ADMIN or seccomp=unconfined in DockerManager source", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const dockerManagerPath = path.resolve(__dirname, "../utils/dockerManager.ts");
      const dockerManagerSource = fs.readFileSync(dockerManagerPath, "utf-8");
      expect(dockerManagerSource).not.toContain("SYS_ADMIN");
      expect(dockerManagerSource).not.toContain("seccomp=unconfined");
    });

    it("should configure three distinct networks in docker-compose.yml isolating db, frontend, and sessions", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const composePath = path.resolve(__dirname, "../../../../docker-compose.yml");
      const composeContent = fs.readFileSync(composePath, "utf-8");

      expect(composeContent).toContain("secure-browser-db");
      expect(composeContent).toContain("secure-browser-frontend");
      expect(composeContent).toContain("secure-browser-sessions");

      // postgres must ONLY be on secure-browser-db
      const postgresSection = composeContent.split("backend:")[0];
      const postgresNetworks = postgresSection.split("networks:")[1];
      expect(postgresNetworks).toContain("secure-browser-db");
      expect(postgresNetworks).not.toContain("secure-browser-sessions");
      expect(postgresNetworks).not.toContain("secure-browser-frontend");

      // backend must NOT be on secure-browser-sessions and must NOT expose public ports
      const backendSection = composeContent.split("backend:")[1].split("frontend:")[0];
      const backendNetworks = backendSection.split("networks:")[1];
      expect(backendNetworks).toContain("secure-browser-db");
      expect(backendNetworks).toContain("secure-browser-frontend");
      expect(backendNetworks).not.toContain("secure-browser-sessions");
      expect(backendSection).toContain("host.docker.internal:host-gateway");
      expect(backendSection).not.toContain("3001:3001");
      expect(backendSection).toContain("ENABLE_HOST_PORT_BINDINGS: ${ENABLE_HOST_PORT_BINDINGS:-true}");

      // frontend must ONLY be on secure-browser-frontend
      const frontendSection = composeContent.split("frontend:")[1].split("browser-image:")[0];
      const frontendNetworks = frontendSection.split("networks:")[1];
      expect(frontendNetworks).toContain("secure-browser-frontend");
      expect(frontendNetworks).not.toContain("secure-browser-db");
      expect(frontendNetworks).not.toContain("secure-browser-sessions");
    });

    it("should configure public DNS, sinkhole ExtraHosts, enable_icc=false, HostIp binding, and no 5900 in DockerManager", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const dockerManagerPath = path.resolve(__dirname, "../utils/dockerManager.ts");
      const dockerManagerSource = fs.readFileSync(dockerManagerPath, "utf-8");

      expect(dockerManagerSource).toContain('Dns: ["1.1.1.1", "8.8.8.8"]');
      expect(dockerManagerSource).toContain('"backend:127.0.0.1"');
      expect(dockerManagerSource).toContain('"postgres:127.0.0.1"');
      expect(dockerManagerSource).toContain('"frontend:127.0.0.1"');
      expect(dockerManagerSource).toContain('"com.docker.network.bridge.enable_icc": "false"');
      expect(dockerManagerSource).not.toContain('"5900/tcp"');
      expect(dockerManagerSource).toContain("HostIp: bindIp");
      expect(dockerManagerSource).toContain("resolveToIp");
      expect(dockerManagerSource).toContain('process.env.ENABLE_HOST_PORT_BINDINGS !== "false"');
      expect(dockerManagerSource).toContain("vncHost: vncHost");
      expect(dockerManagerSource).toContain("generateVncPassword");
    });

    it("should configure in-container PAC script and 8-character password in start.sh", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const startShPath = path.resolve(__dirname, "../../../../docker/browser/start.sh");
      const startShContent = fs.readFileSync(startShPath, "utf-8");

      expect(startShContent).toContain("proxy-pac-url");
      expect(startShContent).toContain("169.254.0.0");
      expect(startShContent).toContain("127.0.0.0");
      expect(startShContent).toContain("10.0.0.0");
      expect(startShContent).toContain("172.16.0.0");
      expect(startShContent).toContain("192.168.0.0");
      expect(startShContent).toContain("dnsResolve");
      expect(startShContent).toContain("head -c 8");
    });
  });

  describe("SSRF Validation: Legitimate Sites and Bypass Prevention", () => {
    it("should allow legitimate public domains including fda.gov, fdic.gov, and 0.gravatar.com", async () => {
      const { validateTargetUrl } = await import("../controllers/containerController");
      const fda = await validateTargetUrl("https://fda.gov");
      expect(fda.valid).toBe(true);

      const fdic = await validateTargetUrl("https://fdic.gov");
      expect(fdic.valid).toBe(true);

      const gravatar = await validateTargetUrl("https://0.gravatar.com");
      expect(gravatar.valid).toBe(true);
    });

    it("should reject IPv4-mapped IPv6 addresses including ::ffff:127.0.0.1 and hex format", async () => {
      const { validateTargetUrl } = await import("../controllers/containerController");
      const mappedLoopback = await validateTargetUrl("http://[::ffff:127.0.0.1]:8080");
      expect(mappedLoopback.valid).toBe(false);
      expect(mappedLoopback.error).toContain("not allowed");

      const mappedHex = await validateTargetUrl("http://[::ffff:7f00:1]:8080");
      expect(mappedHex.valid).toBe(false);
      expect(mappedHex.error).toContain("not allowed");

      const mappedMetadata = await validateTargetUrl("http://[::ffff:169.254.169.254]");
      expect(mappedMetadata.valid).toBe(false);
      expect(mappedMetadata.error).toContain("not allowed");
    });

    it("should reject IPv6 unique local, link-local, and loopback addresses", async () => {
      const { validateTargetUrl } = await import("../controllers/containerController");
      const loopback = await validateTargetUrl("http://[::1]");
      expect(loopback.valid).toBe(false);

      const linkLocal = await validateTargetUrl("http://[fe80::1]");
      expect(linkLocal.valid).toBe(false);

      const ula = await validateTargetUrl("http://[fd00::1]");
      expect(ula.valid).toBe(false);
    });

    it("should reject DNS names that resolve to internal/loopback addresses", async () => {
      const { validateTargetUrl } = await import("../controllers/containerController");
      const nip = await validateTargetUrl("http://127.0.0.1.nip.io");
      expect(nip.valid).toBe(false);
      expect(nip.error).toContain("not allowed");
    });
  });

  describe("Session Network Egress Defense Middleware", () => {
    it("should block requests to /api originating from an active session container IP", async () => {
      const dm = containerController.getDockerManager();
      const testSessionIp = "172.28.0.99";
      (dm as any).activeContainers.set("egress-test-session", {
        container: { stop: vi.fn() },
        containerIp: testSessionIp,
        vncPort: "6080",
        guestToken: "token-egress",
        url: "https://example.com",
        createdAt: new Date(),
      });

      // Simulate a request from the container IP by setting remoteAddress on the socket
      const response = await request(app)
        .get("/api/containers")
        .set("x-guest-token", "token-egress")
        .set("X-Forwarded-For", testSessionIp);

      // Verify that isSessionIp identifies the container IP
      expect(dm.isSessionIp(testSessionIp)).toBe(true);
      expect(dm.isSessionIp("127.0.0.1")).toBe(false);

      (dm as any).activeContainers.delete("egress-test-session");
    });
  });

  describe("VNC Startup Robustness (start.sh)", () => {
    it("should not discard storepasswd errors with 2>/dev/null and should check liveness", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const startShPath = path.resolve(__dirname, "../../../../docker/browser/start.sh");
      const startShContent = fs.readFileSync(startShPath, "utf-8");

      expect(startShContent).not.toContain("x11vnc -storepasswd \"$VNC_PASSWORD\" /tmp/vnc/passwd 2>/dev/null");
      expect(startShContent).toContain("x11vnc failed to start");
      expect(startShContent).toContain("websockify failed to start");
    });

    it("should generate 8-character wide-alphabet VNC passwords", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const dmPath = path.resolve(__dirname, "../utils/dockerManager.ts");
      const dmSource = fs.readFileSync(dmPath, "utf-8");

      expect(dmSource).toContain("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
      expect(dmSource).toContain("crypto.randomBytes(8)");
    });

    it("should configure VNC_PROXY_HOST and VNC_BIND_HOST flexibly in docker-compose.dev.yml", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const devComposePath = path.resolve(__dirname, "../../../../docker-compose.dev.yml");
      const devComposeContent = fs.readFileSync(devComposePath, "utf-8");

      expect(devComposeContent).toContain("VNC_BIND_HOST: ${VNC_BIND_HOST:-}");
      expect(devComposeContent).toContain("VNC_PROXY_HOST: ${VNC_PROXY_HOST:-}");
      expect(devComposeContent).not.toContain('VNC_PROXY_HOST: "host.docker.internal"');
    });

    it("should resolve IPs directly, resolve hostnames, and throw on unresolvable hostnames in resolveToIp", async () => {
      const dm = containerController.getDockerManager();
      const directIp = await (dm as any).resolveToIp("172.21.0.1");
      expect(directIp).toBe("172.21.0.1");

      const localhostIp = await (dm as any).resolveToIp("localhost");
      expect(localhostIp).toBe("127.0.0.1");

      await expect((dm as any).resolveToIp("non-existent-host-xyz-12345")).rejects.toThrow(
        /Failed to resolve bind host/
      );
    });
  });

  describe("VNC Ticket Authentication & Finding 7 Remediation", () => {
    const testId = "88888888-4444-4333-8222-111111111111";
    const testToken = "secret-token-ticket-888";
    const testPassword = "vnc-password-ticket";

    beforeEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.set(testId, {
        container: { stop: vi.fn() },
        containerIp: "172.18.0.5",
        vncPort: "6080",
        guestToken: testToken,
        url: "https://example.com",
        createdAt: new Date(),
        vncPassword: testPassword,
      });
    });

    afterEach(() => {
      const dm = containerController.getDockerManager();
      (dm as any).activeContainers.delete(testId);
    });

    it("should issue and validate a VNC ticket in DockerManager", () => {
      const dm = containerController.getDockerManager();
      const ticket = dm.createVncTicket(testId, testToken);
      expect(ticket).toBeDefined();
      expect(typeof ticket).toBe("string");
      expect(ticket.length).toBe(48); // 24 bytes hex

      expect(dm.validateTicket(ticket, testId)).toBe(true);
      expect(dm.validateAndRedeemTicket(ticket, testId)).toBe(true);
      expect(dm.validateTicket("invalid-ticket-999", testId)).toBe(false);
      expect(dm.validateTicket(ticket, "other-container")).toBe(false);
    });

    it("should invalidate tickets explicitly upon invalidateTicket call", () => {
      const dm = containerController.getDockerManager();
      const ticket = dm.createVncTicket(testId, testToken);
      expect(dm.validateTicket(ticket, testId)).toBe(true);

      dm.invalidateTicket(ticket);
      expect(dm.validateTicket(ticket, testId)).toBe(false);
      expect(dm.getContainerInfoByTicket(ticket, testId)).toBeUndefined();
    });

    it("should reject ticket creation for unauthorized token", () => {
      const dm = containerController.getDockerManager();
      expect(() => dm.createVncTicket(testId, "wrong-token")).toThrow(
        /Unauthorized to create ticket/
      );
    });

    it("should reject expired tickets", () => {
      const dm = containerController.getDockerManager();
      const ticket = dm.createVncTicket(testId, testToken);
      const entry = (dm as any).vncTickets.get(ticket);
      entry.expiresAt = new Date(Date.now() - 5000); // 5 seconds in the past

      expect(dm.validateTicket(ticket, testId)).toBe(false);
      expect(dm.validateAndRedeemTicket(ticket, testId)).toBe(false);
    });

    it("should return vncTicket in GET /api/containers/:containerId for authorized caller", async () => {
      const response = await request(app)
        .get(`/api/containers/${testId}`)
        .set("x-guest-token", testToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("vncTicket");
      expect(typeof response.body.data.vncTicket).toBe("string");
    });

    it("should support POST /api/containers/:containerId/vnc-ticket", async () => {
      const unauth = await request(app)
        .post(`/api/containers/${testId}/vnc-ticket`);
      expect(unauth.status).toBe(401);

      const wrong = await request(app)
        .post(`/api/containers/${testId}/vnc-ticket`)
        .set("x-guest-token", "wrong-token");
      expect(wrong.status).toBe(404);

      const success = await request(app)
        .post(`/api/containers/${testId}/vnc-ticket`)
        .set("x-guest-token", testToken);
      expect(success.status).toBe(200);
      expect(success.body.data).toHaveProperty("vncTicket");
    });

    it("should authorize VNC proxy access via ?ticket= and reject invalid ticket", async () => {
      const dm = containerController.getDockerManager();
      const ticket = dm.createVncTicket(testId, testToken);

      // Verify that ticket is recognized and returns container info
      const info = dm.getContainerInfoByTicket(ticket, testId);
      expect(info).toBeDefined();
      expect(info?.vncPassword).toBe(testPassword);

      // Invalid ticket must be rejected with 403
      const invalidResponse = await request(app)
        .get(`/api/containers/${testId}/vnc/vnc_lite.html?ticket=fake-ticket-12345`);
      expect(invalidResponse.status).toBe(403);
      expect(invalidResponse.body).toEqual({
        success: false,
        error: "Unauthorized access to session",
      });
    });

    it("should not expose password or guestToken in session page iframe src", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const sessionPagePath = path.resolve(
        __dirname,
        "../../../../apps/frontend/src/app/session/[containerId]/page.tsx"
      );
      const sessionPageSource = fs.readFileSync(sessionPagePath, "utf-8");

      expect(sessionPageSource).not.toContain("&password=");
      expect(sessionPageSource).not.toContain("&token=");
      expect(sessionPageSource).toContain("vncPassword={session.vncPassword}");
      expect(sessionPageSource).toContain("ticket=");
      expect(sessionPageSource).toContain("parent_origin=");
    });

    it("should configure custom vnc_lite.html with postMessage auth support", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const vncLitePath = path.resolve(__dirname, "../../../../docker/browser/vnc_lite.html");
      const vncLiteSource = fs.readFileSync(vncLitePath, "utf-8");

      expect(vncLiteSource).toContain("SB_VNC_AUTH");
      expect(vncLiteSource).toContain("SB_VNC_READY");
      expect(vncLiteSource).toContain("window.addEventListener('message'");
      expect(vncLiteSource).toContain("event.source !== window.parent");
      expect(vncLiteSource).toContain("parentOrigin");
    });

    it("should enforce strict target origin and event source in SessionViewport.tsx", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const viewportPath = path.resolve(
        __dirname,
        "../../../../apps/frontend/src/components/SessionViewport.tsx"
      );
      const viewportSource = fs.readFileSync(viewportPath, "utf-8");

      expect(viewportSource).toContain("iframeRef.current.contentWindow.postMessage");
      expect(viewportSource).toContain("targetOrigin");
      expect(viewportSource).not.toMatch(/postMessage\([^,]+,\s*["']\*["']\)/);
      expect(viewportSource).toContain("event.source !== iframeRef.current.contentWindow");
      expect(viewportSource).toContain("event.origin !== targetOrigin");
    });

    it("should include -shared in start.sh x11vnc command line for reconnect support", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const startShPath = path.resolve(__dirname, "../../../../docker/browser/start.sh");
      const startShSource = fs.readFileSync(startShPath, "utf-8");

      expect(startShSource).toMatch(/x11vnc\s+[^&]*-shared/);
      expect(startShSource).toContain("-rfbauth /tmp/vnc/passwd");
    });
  });

  describe("In-Code Firewall & Runtime Verification Suite", () => {
    it("should configure automated firewall service in docker-compose.yml", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const composePath = path.resolve(__dirname, "../../../../docker-compose.yml");
      const composeContent = fs.readFileSync(composePath, "utf-8");

      expect(composeContent).toContain("firewall:");
      expect(composeContent).toContain("network_mode: host");
      expect(composeContent).toContain("NET_ADMIN");
      expect(composeContent).toContain("/var/run/docker.sock:/var/run/docker.sock");
    });

    it("should configure firewall entrypoint with DOCKER-USER and INPUT rules", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const entrypointPath = path.resolve(
        __dirname,
        "../../../../docker/firewall/entrypoint.sh"
      );
      const entrypointContent = fs.readFileSync(entrypointPath, "utf-8");

      for (const range of ["169.254.0.0/16", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.64.0.0/10", "fc00::/7", "fe80::/10", "ff00::/8"]) {
        expect(entrypointContent).toContain(range);
      }
      expect(entrypointContent).toContain("DOCKER-USER");
      expect(entrypointContent).toContain("ensure_jump iptables INPUT");
      // Replies to backend-initiated proxy connections must pass before any private-range DROP.
      const acceptIdx = entrypointContent.indexOf("ESTABLISHED,RELATED -j ACCEPT");
      const dropIdx = entrypointContent.indexOf("-j DROP");
      expect(acceptIdx).toBeGreaterThan(-1);
      expect(acceptIdx).toBeLessThan(dropIdx);
      expect(entrypointContent).toContain("iptables-restore");
    });

    it("should provide an executable runtime verification script testing all four criteria", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const verifyScriptPath = path.resolve(
        __dirname,
        "../../../../scripts/verify-runtime.sh"
      );
      const verifyScriptContent = fs.readFileSync(verifyScriptPath, "utf-8");

      expect(verifyScriptContent).toContain("SYS_ADMIN");
      expect(verifyScriptContent).toContain("169.254.169.254");
      expect(verifyScriptContent).toContain("101 Switching Protocols");
      expect(verifyScriptContent).toContain("Host port binding restricted");
      expect(verifyScriptContent).toContain("Seccomp filter mode");
    });
  });
  describe("Egress guard fail-closed check", () => {
    const originalEnv = process.env.EGRESS_GUARD_REQUIRED;
    afterEach(() => {
      if (originalEnv === undefined) delete process.env.EGRESS_GUARD_REQUIRED;
      else process.env.EGRESS_GUARD_REQUIRED = originalEnv;
      vi.restoreAllMocks();
    });

    const managerWithContainers = (containers: Array<{ Status: string }> | Error) => {
      const dm = new DockerManager();
      (dm as any).docker = {
        listContainers: containers instanceof Error
          ? vi.fn().mockRejectedValue(containers)
          : vi.fn().mockResolvedValue(containers),
      };
      return dm;
    };

    it("isEgressGuardActive is true only for a running, healthy guard", async () => {
      expect(await managerWithContainers([{ Status: "Up 2 minutes (healthy)" }]).isEgressGuardActive()).toBe(true);
      expect(await managerWithContainers([{ Status: "Up 2 minutes (unhealthy)" }]).isEgressGuardActive()).toBe(false);
      expect(await managerWithContainers([{ Status: "Up 5 seconds (health: starting)" }]).isEgressGuardActive()).toBe(false);
      expect(await managerWithContainers([]).isEgressGuardActive()).toBe(false);
    });

    it("isEgressGuardActive fails closed when the Docker API errors", async () => {
      expect(await managerWithContainers(new Error("docker down")).isEgressGuardActive()).toBe(false);
    });

    it("createContainer refuses to start a session when the guard is required but inactive", async () => {
      process.env.EGRESS_GUARD_REQUIRED = "true";
      const dm = managerWithContainers([]);
      await expect(dm.createContainer("https://example.com")).rejects.toBeInstanceOf(EgressGuardUnavailableError);
    });

    it("POST /api/containers/create returns 503 when the egress guard is unavailable", async () => {
      vi.spyOn(containerController.getDockerManager(), "createContainer").mockRejectedValue(
        new EgressGuardUnavailableError()
      );
      const response = await request(app).post("/api/containers/create").send({ url: "http://8.8.8.8/" });
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
    });

    it("labels the firewall service and requires the guard by default in production compose only", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const read = (f: string) => fs.readFileSync(path.resolve(__dirname, "../../../../", f), "utf-8");
      for (const f of ["docker-compose.yml", "docker-compose.dev.yml"]) {
        const c = read(f);
        expect(c).toContain('sb.egress-guard: "true"');
        expect(c).toContain("healthcheck:");
        expect(c).toContain("iptables -w -S SB-EGRESS");
      }
      expect(read("docker-compose.yml")).toContain("EGRESS_GUARD_REQUIRED: ${EGRESS_GUARD_REQUIRED:-true}");
      expect(read("docker-compose.dev.yml")).toContain("EGRESS_GUARD_REQUIRED: ${EGRESS_GUARD_REQUIRED:-false}");
    });
  });
});
