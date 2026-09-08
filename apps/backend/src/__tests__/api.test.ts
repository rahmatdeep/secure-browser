import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../index";

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

  describe("GET /api/containers", () => {
    it("should return 200 and an array of active containers", async () => {
      const response = await request(app).get("/api/containers");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
