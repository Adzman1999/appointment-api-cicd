export function up(pgm) {
  pgm.addColumn("appointment_slots", {
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "available",
    },
    held_by_user_id: {
      type: "integer",
      notNull: false,
      references: '"users"',
      onDelete: "SET NULL",
    },
    held_until: {
      type: "timestamptz",
      notNull: false,
    },
  });

  pgm.addConstraint("appointment_slots", "appointment_slot_status_valid", {
    check: "status IN ('available', 'held', 'booked')",
  });

  pgm.createIndex("appointment_slots", ["status", "held_until"], {
    name: "idx_slots_status_held_until",
  });
}

export function down(pgm) {
  pgm.dropIndex("appointment_slots", ["status", "held_until"], {
    name: "idx_slots_status_held_until",
  });
  pgm.dropConstraint("appointment_slots", "appointment_slot_status_valid");
  pgm.dropColumns("appointment_slots", ["status", "held_by_user_id", "held_until"]);
}
