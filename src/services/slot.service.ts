import { pool } from "../db/pool.js";
import { AppError } from "../errors/app-error.js";
import { holdSlot, listAllSlots, releaseHold } from "../repositories/slot.repository.js";

export async function getSlots(userId?: number) {
  return await listAllSlots(userId);
}

export async function reserveSlotHold(slotId: number, userId: number, durationMinutes: number = 3) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const held = await holdSlot(client, slotId, userId, durationMinutes);

    if (!held) {
      throw new AppError(409, "Slot is already booked or currently on hold by another user");
    }

    await client.query("COMMIT");
    return held;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelSlotHold(slotId: number, userId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const released = await releaseHold(client, slotId, userId);

    if (!released) {
      throw new AppError(404, "Active hold not found or not owned by you");
    }

    await client.query("COMMIT");
    return { success: true, message: "Hold released successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
