import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "./app.js";

describe("API foundation", () => {
  it("returns 200 from GET /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "appointment-api-cicd",
    });
  });

  it("returns JSON 404 for an unknown route", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        message: "Route not found: GET /does-not-exist",
      },
    });
  });
});