export function up(pgm) {
  // Remove the original UNIQUE constraint on slot_id.
  pgm.sql(`
    ALTER TABLE appointments
    DROP CONSTRAINT IF EXISTS appointments_slot_id_key
  `);

  // Only active bookings must have a unique slot.
  pgm.sql(`
    CREATE UNIQUE INDEX appointments_one_active_booking_per_slot
    ON appointments (slot_id)
    WHERE status = 'booked'
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS appointments_one_active_booking_per_slot
  `);

  pgm.sql(`
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_slot_id_key UNIQUE (slot_id)
  `);
}