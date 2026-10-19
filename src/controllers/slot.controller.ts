import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { cancelSlotHold, getSlots, reserveSlotHold } from "../services/slot.service.js";

export async function listSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slots = await getSlots(req.user?.id);
    res.status(200).json({ data: slots });
  } catch (error) {
    next(error);
  }
}

export async function holdSlotController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const slotId = Number(req.params.id);
    if (!Number.isSafeInteger(slotId) || slotId < 1) {
      throw new AppError(400, "slotId must be a positive integer");
    }

    const held = await reserveSlotHold(slotId, req.user.id, 3);
    res.status(200).json({ data: held, message: "Slot reserved for 3 minutes" });
  } catch (error) {
    next(error);
  }
}

export async function releaseSlotHoldController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const slotId = Number(req.params.id);
    if (!Number.isSafeInteger(slotId) || slotId < 1) {
      throw new AppError(400, "slotId must be a positive integer");
    }

    const result = await cancelSlotHold(slotId, req.user.id);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}
