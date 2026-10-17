export function up(pgm) {
  pgm.createTable("users", {
    id: "id",
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("providers", {
    id: "id",
    name: {
      type: "varchar(150)",
      notNull: true,
    },
    specialty: {
      type: "varchar(150)",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("appointment_slots", {
    id: "id",
    provider_id: {
      type: "integer",
      notNull: true,
      references: '"providers"',
      onDelete: "RESTRICT",
    },
    starts_at: {
      type: "timestamptz",
      notNull: true,
    },
    ends_at: {
      type: "timestamptz",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("appointment_slots", "slot_end_after_start", {
    check: "ends_at > starts_at",
  });

  pgm.addConstraint("appointment_slots", "unique_provider_slot_start", {
    unique: ["provider_id", "starts_at"],
  });

  pgm.createTable("appointments", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "RESTRICT",
    },
    slot_id: {
      type: "integer",
      notNull: true,
      unique: true,
      references: '"appointment_slots"',
      onDelete: "RESTRICT",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "booked",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("appointments", "appointment_status_valid", {
    check: "status IN ('booked', 'cancelled')",
  });
}

export function down(pgm) {
  pgm.dropTable("appointments");
  pgm.dropTable("appointment_slots");
  pgm.dropTable("providers");
  pgm.dropTable("users");
}