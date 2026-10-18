import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("HTTP integration tests", () => {
  it("GET /health returns 200 and a healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("appointment-api-cicd");
  });

  it("unknown routes return JSON 404", async () => {
    const response = await request(app).get("/route-that-does-not-exist");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("rejects an invalid registration request", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({});

    expect(response.status).toBe(400);
  });

  it("rejects appointment access without authentication", async () => {
    const response = await request(app).get("/appointments");

    expect(response.status).toBe(401);
  });
});
