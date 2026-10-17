import { pool } from "../db/pool.js";

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | undefined> {
  const result = await pool.query<UserRecord>(
    `SELECT id, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email],
  );

  return result.rows[0];
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<Omit<UserRecord, "password_hash">> {
  const result = await pool.query<Omit<UserRecord, "password_hash">>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash],
  );

  return result.rows[0];
}