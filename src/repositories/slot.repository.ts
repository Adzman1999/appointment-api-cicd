import type { PoolClient } from "pg";
import { pool } from "../db/pool.js";

export interface SlotWithProvider {
  id: number;
  provider_id: number;
  provider_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "held" | "booked";
  held_by_user_id: number | null;
  held_until: string | null;
  is_held_by_me?: boolean;
}

export async function listAllSlots(currentUserId?: number): Promise<SlotWithProvider[]> {
  // Any slot where status = 'held' but held_until < NOW() is treated as 'available'
  const query = `
    SELECT 
      s.id,
      s.provider_id,
      p.name AS provider_name,
      p.specialty,
      s.starts_at,
      s.ends_at,
      CASE 
        WHEN s.status = 'booked' THEN 'booked'
        WHEN s.status = 'held' AND s.held_until > NOW() THEN 'held'
        ELSE 'available'
      END AS status,
      CASE
        WHEN s.status = 'held' AND s.held_until > NOW() THEN s.held_by_user_id
        ELSE NULL
      END AS held_by_user_id,
      CASE
        WHEN s.status = 'held' AND s.held_until > NOW() THEN s.held_until
        ELSE NULL
      END AS held_until
    FROM appointment_slots s
    JOIN providers p ON s.provider_id = p.id
    ORDER BY s.starts_at ASC
  `;

  const result = await pool.query(query);

  return result.rows.map((row) => ({
    ...row,
    is_held_by_me: currentUserId ? row.held_by_user_id === currentUserId : false,
  }));
}

export async function holdSlot(
  client: PoolClient,
  slotId: number,
  userId: number,
  durationMinutes: number = 3,
): Promise<SlotWithProvider | null> {
  const query = `
    UPDATE appointment_slots
    SET 
      status = 'held',
      held_by_user_id = $1,
      held_until = NOW() + ($3 || ' minutes')::INTERVAL
    WHERE id = $2 
      AND (
        status = 'available' 
        OR (status = 'held' AND (held_until <= NOW() OR held_by_user_id = $1))
      )
    RETURNING id, provider_id, starts_at, ends_at, status, held_by_user_id, held_until
  `;

  const result = await client.query(query, [userId, slotId, durationMinutes]);

  if (result.rowCount === 0) {
    return null;
  }

  const slot = result.rows[0];
  return {
    ...slot,
    provider_name: "",
    specialty: "",
    is_held_by_me: true,
  };
}

export async function releaseHold(
  client: PoolClient,
  slotId: number,
  userId: number,
): Promise<boolean> {
  const query = `
    UPDATE appointment_slots
    SET 
      status = 'available',
      held_by_user_id = NULL,
      held_until = NULL
    WHERE id = $1 AND held_by_user_id = $2 AND status = 'held'
  `;

  const result = await client.query(query, [slotId, userId]);
  return (result.rowCount ?? 0) > 0;
}
