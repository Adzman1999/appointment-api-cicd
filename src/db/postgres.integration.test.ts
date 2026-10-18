import {
    bookAppointment,
    cancelAppointment,
} from "../services/appointment.service.js";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";
import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

const pool = new Pool({
    connectionString: env.databaseUrl,
    max: 3,
});

let userId: number;
let providerId: number;
let slotId: number;

const createdUserIds: number[] = [];
const createdProviderIds: number[] = [];
const createdSlotIds: number[] = [];

describe("PostgreSQL integration", () => {
    beforeAll(async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        if (result.rows[0]?.db !== "appointment_test") {
            throw new Error(
                `Unsafe integration-test database: ${result.rows[0]?.db}`,
            );
        }
    });

    beforeEach(async () => {
        const suffix = `${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;

        const user = await pool.query(
            `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
            [`integration-${suffix}@example.com`, "test-only-hash"],
        );

        userId = user.rows[0].id;
        createdUserIds.push(userId);

        const provider = await pool.query(
            `INSERT INTO providers (name, specialty)
       VALUES ($1, $2)
       RETURNING id`,
            [`Integration Provider ${suffix}`, "Testing"],
        );

        providerId = provider.rows[0].id;
        createdProviderIds.push(providerId);

        const slot = await pool.query(
            `INSERT INTO appointment_slots
         (provider_id, starts_at, ends_at)
       VALUES
         ($1, NOW() + INTERVAL '2 days',
          NOW() + INTERVAL '2 days 30 minutes')
       RETURNING id`,
            [providerId],
        );

        slotId = slot.rows[0].id;
        createdSlotIds.push(slotId);
    });

    afterEach(async () => {
        // Delete only rows created by this test file.
        // Respect foreign-key dependencies: child rows first.
        if (createdSlotIds.length > 0) {
            await pool.query(
                "DELETE FROM appointments WHERE slot_id = ANY($1::int[])",
                [createdSlotIds],
            );

            await pool.query(
                "DELETE FROM appointment_slots WHERE id = ANY($1::int[])",
                [createdSlotIds],
            );

            createdSlotIds.length = 0;
        }

        if (createdUserIds.length > 0) {
            await pool.query(
                "DELETE FROM users WHERE id = ANY($1::int[])",
                [createdUserIds],
            );

            createdUserIds.length = 0;
        }

        if (createdProviderIds.length > 0) {
            await pool.query(
                "DELETE FROM providers WHERE id = ANY($1::int[])",
                [createdProviderIds],
            );

            createdProviderIds.length = 0;
        }
    });

    afterAll(async () => {
        await pool.end();
    });

    it("connects to the isolated test database", async () => {
        const result = await pool.query(
            "SELECT current_database() AS db",
        );

        expect(result.rows[0].db).toBe("appointment_test");
    });

    it("inserts and retrieves a user", async () => {
        const result = await pool.query(
            "SELECT id, email FROM users WHERE id = $1",
            [userId],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].id).toBe(userId);
        expect(result.rows[0].email).toContain(
            "integration-",
        );
    });

    it("enforces the appointment slot foreign key", async () => {
        await expect(
            pool.query(
                `INSERT INTO appointment_slots
           (provider_id, starts_at, ends_at)
         VALUES ($1, NOW() + INTERVAL '3 days',
                 NOW() + INTERVAL '3 days 30 minutes')`,
                [-999999],
            ),
        ).rejects.toMatchObject({
            code: "23503",
        });
    });

    it("enforces one active booking per slot", async () => {
        await pool.query(
            `INSERT INTO appointments (user_id, slot_id, status)
       VALUES ($1, $2, 'booked')`,
            [userId, slotId],
        );

        await expect(
            pool.query(
                `INSERT INTO appointments (user_id, slot_id, status)
         VALUES ($1, $2, 'booked')`,
                [userId, slotId],
            ),
        ).rejects.toMatchObject({
            code: "23505",
        });
    });

    it("rolls back changes when a transaction fails", async () => {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO providers (name, specialty)
         VALUES ($1, $2)
         RETURNING id`,
                [
                    `Rollback Provider ${Date.now()}`,
                    "Temporary",
                ],
            );

            const insertedId = result.rows[0].id;

            await client.query("ROLLBACK");

            const check = await pool.query(
                "SELECT id FROM providers WHERE id = $1",
                [insertedId],
            );

            expect(check.rows).toHaveLength(0);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    });


    it("books an appointment and persists it in PostgreSQL", async () => {
        const booking = await bookAppointment(userId, slotId);

        expect(booking).toMatchObject({
            user_id: userId,
            slot_id: slotId,
            status: "booked",
        });

        const result = await pool.query(
            `SELECT id, status
     FROM appointments
     WHERE id = $1`,
            [booking.id],
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].status).toBe("booked");
    });

    it("rejects a duplicate booking through the real service", async () => {
        await bookAppointment(userId, slotId);

        await expect(
            bookAppointment(userId, slotId),
        ).rejects.toMatchObject({
            statusCode: 409,
        });

        const result = await pool.query(
            `SELECT COUNT(*)::int AS count
     FROM appointments
     WHERE slot_id = $1
       AND status = 'booked'`,
            [slotId],
        );

        expect(result.rows[0].count).toBe(1);
    });

    it("cancels an appointment and persists the new status", async () => {
        const booking = await bookAppointment(userId, slotId);

        await cancelAppointment(userId, booking.id);

        const result = await pool.query(
            `SELECT status
     FROM appointments
     WHERE id = $1`,
            [booking.id],
        );

        expect(result.rows[0].status).toBe("cancelled");
    });

});
