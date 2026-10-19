import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";

import { bookAppointment, cancelAppointment } from "../services/appointment.service.js";

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);

  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    throw new AppError(400, `${field} must be a positive integer`);
  }
  return parsed;
}

export async function createAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const slotId = positiveInteger(req.body?.slotId, "slotId");

    const appointment = await bookAppointment(
      req.user.id,
      slotId,
    );

    res.status(201).json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const appointmentId = positiveInteger(
      req.params.id,
      "appointmentId",
    );

    const appointment = await cancelAppointment(
      req.user.id,
      appointmentId,
    );

    res.status(200).json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

export async function listMyAppointments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const { getMyAppointments } = await import("../services/appointment.service.js");
    const appointments = await getMyAppointments(req.user.id);
    res.status(200).json({ data: appointments });
  } catch (error) {
    next(error);
  }
}