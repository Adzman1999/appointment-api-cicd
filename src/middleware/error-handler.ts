import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                message: error.message,
            },
        });
        return;
    }

    console.error("Unhandled application error:", error);

    res.status(500).json({
        error: {
            message: "Internal server error",
        },
    });
}