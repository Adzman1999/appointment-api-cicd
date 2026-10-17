import { pool } from "./pool.js";

try {
  const result = await pool.query<{
    database: string;
    current_time: Date;
  }>(`
    SELECT
      current_database() AS database,
      current_timestamp AS current_time
  `);

  console.log("PostgreSQL connection successful:");
  console.log(result.rows[0]);
} catch (error) {
  console.error("PostgreSQL connection failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}