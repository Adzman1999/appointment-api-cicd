import { pool } from "../db/pool.js";
import { AppError } from "../errors/app-error.js";

import {
  activeBookingExists,
  cancelBooking,
  findBookingForUpdate,
  findSlotForUpdate,
  insertBooking,
  listUserAppointments,
  updateSlotStatus,
  userExists,
} from "../repositories/appointment.repository.js";

export async function bookAppointment(
  userId: number,
  slotId: number,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!(await userExists(client, userId))) {
      throw new AppError(404, "User not found");
    }

    const slot = await findSlotForUpdate(client, slotId);

    if (!slot) {
      throw new AppError(404, "Appointment slot not found");
    }

    if (new Date(slot.starts_at).getTime() <= Date.now()) {
      throw new AppError(400, "Cannot book a slot that has already started");
    }

    if (await activeBookingExists(client, slotId)) {
      throw new AppError(409, "Appointment slot is already booked");
    }

    const appointment = await insertBooking(client, userId, slotId);
    await updateSlotStatus(client, slotId, "booked");

    await client.query("COMMIT");

    return appointment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelAppointment(
  userId: number,
  appointmentId: number,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appointment = await findBookingForUpdate(
      client,
      appointmentId,
    );

    if (!appointment) {
      throw new AppError(404, "Appointment not found");
    }

    if (Number(appointment.user_id) !== userId) {
      throw new AppError(403, "You cannot cancel this appointment");
    }

    if (appointment.status !== "booked") {
      throw new AppError(409, "Appointment is not currently booked");
    }

    const cancelled = await cancelBooking(client, appointmentId);
    await updateSlotStatus(client, appointment.slot_id, "available");

    await client.query("COMMIT");

    return cancelled;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMyAppointments(userId: number) {
  return await listUserAppointments(userId);
}