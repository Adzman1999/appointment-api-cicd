import type { PoolClient } from "pg";

export interface SlotRow {
  id: number;
  starts_at: Date;
  ends_at: Date;
}

export async function findSlotForUpdate(
  client: PoolClient,
  slotId: number,
): Promise<SlotRow | undefined> {
  const result = await client.query<SlotRow>(
    `SELECT id, starts_at, ends_at
     FROM appointment_slots
     WHERE id = $1
     FOR UPDATE`,
    [slotId],
  );

  return result.rows[0];
}

export async function userExists(
  client: PoolClient,
  userId: number,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM users WHERE id = $1`,
    [userId],
  );

  return result.rowCount === 1;
}

export async function activeBookingExists(
  client: PoolClient,
  slotId: number,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM appointments
     WHERE slot_id = $1 AND status = 'booked'
     LIMIT 1`,
    [slotId],
  );

  return result.rowCount === 1;
}

export async function insertBooking(
  client: PoolClient,
  userId: number,
  slotId: number,
) {
  const result = await client.query(
    `INSERT INTO appointments (user_id, slot_id, status)
     VALUES ($1, $2, 'booked')
     RETURNING id, user_id, slot_id, status, created_at`,
    [userId, slotId],
  );

  return result.rows[0];
}

export async function findBookingForUpdate(
  client: PoolClient,
  appointmentId: number,
) {
  const result = await client.query(
    `SELECT id, user_id, slot_id, status
     FROM appointments
     WHERE id = $1
     FOR UPDATE`,
    [appointmentId],
  );

  return result.rows[0];
}

export async function cancelBooking(
  client: PoolClient,
  appointmentId: number,
) {
  const result = await client.query(
    `UPDATE appointments
     SET status = 'cancelled'
     WHERE id = $1 AND status = 'booked'
     RETURNING id, user_id, slot_id, status`,
    [appointmentId],
  );

  return result.rows[0];
}