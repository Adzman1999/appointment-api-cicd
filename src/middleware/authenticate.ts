import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export interface AuthenticatedUser {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string"
    ) {
      next(new AppError(401, "Invalid access token"));
      return;
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      next(new AppError(401, "Invalid access token"));
      return;
    }

    req.user = { id: userId };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
}