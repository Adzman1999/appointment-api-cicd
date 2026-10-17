
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";

function validationDetails(
  issues: z.ZodIssue[],
): { field: string; message: string }[] {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}

export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          400,
          "Request validation failed",
          "VALIDATION_ERROR",
          validationDetails(result.error.issues),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateParams(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(
        new AppError(
          400,
          "Request validation failed",
          "VALIDATION_ERROR",
          validationDetails(result.error.issues),
        ),
      );
      return;
    }

    next();
  };
}
