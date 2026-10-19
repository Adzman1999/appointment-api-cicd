import { pool } from "./pool.js";

export async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("Seeding providers and future appointment slots...");

    // Insert sample healthcare providers
    const providersResult = await client.query(`
      INSERT INTO providers (name, specialty)
      VALUES 
        ('Dr. Sarah Jenkins', 'Cardiology'),
        ('Dr. Marcus Chen', 'Dermatology'),
        ('Dr. Elena Rodriguez', 'Pediatrics'),
        ('Dr. James Wilson', 'Orthopedics')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);

    let providers = providersResult.rows;

    if (providers.length === 0) {
      const existing = await client.query(`SELECT id, name FROM providers LIMIT 4`);
      providers = existing.rows;
    }

    if (providers.length === 0) {
      console.log("No providers found to seed slots.");
      return;
    }

    // Generate slots for tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const slotTimes = [
      { startHour: 9, startMin: 0, endHour: 9, endMin: 30 },
      { startHour: 10, startMin: 0, endHour: 10, endMin: 30 },
      { startHour: 11, startMin: 0, endHour: 11, endMin: 30 },
      { startHour: 14, startMin: 0, endHour: 14, endMin: 30 },
      { startHour: 15, startMin: 0, endHour: 15, endMin: 30 },
    ];

    for (const provider of providers) {
      for (const t of slotTimes) {
        const slotStart = new Date(tomorrow);
        slotStart.setHours(t.startHour, t.startMin, 0, 0);

        const slotEnd = new Date(tomorrow);
        slotEnd.setHours(t.endHour, t.endMin, 0, 0);

        await client.query(`
          INSERT INTO appointment_slots (provider_id, starts_at, ends_at, status)
          VALUES ($1, $2, $3, 'available')
          ON CONFLICT (provider_id, starts_at) DO NOTHING
        `, [provider.id, slotStart.toISOString(), slotEnd.toISOString()]);
      }
    }

    console.log("Database seeded successfully with doctors and future slots!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
