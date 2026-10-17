import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import {
  createUser,
  findUserByEmail,
} from "../repositories/auth.repository.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createAccessToken(userId: number): string {
  return jwt.sign(
    { sub: String(userId) },
    env.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: "15m",
    },
  );
}

export async function registerUser(
  rawEmail: unknown,
  rawPassword: unknown,
) {
  if (
    typeof rawEmail !== "string" ||
    typeof rawPassword !== "string"
  ) {
    throw new AppError(400, "Email and password are required");
  }

  const email = normalizeEmail(rawEmail);

  if (email.length > 255 || !EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "A valid email is required");
  }

  if (rawPassword.length < 12 || rawPassword.length > 72) {
    throw new AppError(
      400,
      "Password must be between 12 and 72 characters",
    );
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  try {
    const user = await createUser(email, passwordHash);

    return {
      user,
      accessToken: createAccessToken(user.id),
      tokenType: "Bearer",
      expiresIn: 900,
    };
  } catch (error) {
    // PostgreSQL unique violation: another request may have
    // registered this email after the initial lookup.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
}

export async function loginUser(
  rawEmail: unknown,
  rawPassword: unknown,
) {
  if (
    typeof rawEmail !== "string" ||
    typeof rawPassword !== "string" ||
    rawEmail.length > 255 ||
    rawPassword.length === 0 ||
    rawPassword.length > 72
  ) {
    throw new AppError(401, "Invalid email or password");
  }

  const email = normalizeEmail(rawEmail);
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    rawPassword,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    accessToken: createAccessToken(user.id),
    tokenType: "Bearer",
    expiresIn: 900,
  };
}