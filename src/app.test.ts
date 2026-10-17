import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app.js";

describe("API contracts", () => {
  it("returns the health response", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "appointment-api-cicd",
    });
  });

  it("returns a consistent not-found response", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.message).toBe(
      "Route not found: GET /does-not-exist",
    );
  });

  it("rejects invalid registration input before calling the service", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "not-an-email",
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe(
      "Request validation failed",
    );
    expect(response.body.error.details).toBeInstanceOf(Array);
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });
});
