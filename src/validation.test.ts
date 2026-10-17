
import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
} from "./validation/auth.schemas.js";
import {
  appointmentIdParamsSchema,
  bookAppointmentSchema,
} from "./validation/appointment.schemas.js";

describe("Authentication schemas", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      email: "person@example.com",
      password: "LocalDevPassword!123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "LocalDevPassword!123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a short registration password", () => {
    const result = registerSchema.safeParse({
      email: "person@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected registration fields", () => {
    const result = registerSchema.safeParse({
      email: "person@example.com",
      password: "LocalDevPassword!123",
      role: "admin",
    });

    expect(result.success).toBe(false);
  });

  it("requires a non-empty login password", () => {
    const result = loginSchema.safeParse({
      email: "person@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("Appointment schemas", () => {
  it("accepts a positive integer slot ID", () => {
    expect(
      bookAppointmentSchema.safeParse({ slotId: 10 }).success,
    ).toBe(true);
  });

  it.each([
    { slotId: 0 },
    { slotId: -1 },
    { slotId: 1.5 },
    { slotId: "10" },
    { slotId: null },
    {},
  ])("rejects an invalid booking payload: %o", (payload) => {
    expect(bookAppointmentSchema.safeParse(payload).success).toBe(false);
  });

  it("accepts a positive integer URL ID", () => {
    expect(
      appointmentIdParamsSchema.safeParse({ id: "10" }).success,
    ).toBe(true);
  });

  it.each(["0", "-1", "1.5", "abc", "9007199254740992"])(
    "rejects an invalid URL ID: %s",
    (id) => {
      expect(
        appointmentIdParamsSchema.safeParse({ id }).success,
      ).toBe(false);
    },
  );
});
