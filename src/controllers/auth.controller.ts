import type { Request, Response, NextFunction } from "express";

import {
  loginUser,
  registerUser,
} from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerUser(
      req.body?.email,
      req.body?.password,
    );

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginUser(
      req.body?.email,
      req.body?.password,
    );

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}