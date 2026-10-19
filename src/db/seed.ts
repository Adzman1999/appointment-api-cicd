import { pool } from "./pool.js";

export async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("Seeding top Philippine medical specialists and future appointment slots...");

    // Insert sample reputable Philippine healthcare specialists (Manila, BGC, Makati, Cebu)
    const providersResult = await client.query(`
      INSERT INTO providers (name, specialty)
      VALUES 
        ('Dr. Maria Santos, MD', 'Cardiology (St. Luke''s BGC)'),
        ('Dr. Juan Carlos Reyes, MD', 'Dermatology & Skin Center (Makati Med)'),
        ('Dr. Kristine Joy Alcantara, MD', 'Pediatrics & Child Care (The Medical City)'),
        ('Dr. Gabriel Mendoza, MD', 'Orthopedics & Sports Rehab (Asian Hospital)'),
        ('Dr. Beatrice Lim, MD', 'Internal Medicine & Executive Checkup (Manila Doctors)')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);

    let providers = providersResult.rows;

    if (providers.length === 0) {
      const existing = await client.query(`SELECT id, name FROM providers LIMIT 5`);
      providers = existing.rows;
    }

    if (providers.length === 0) {
      console.log("No providers found to seed slots.");
      return;
    }

    // Generate slots for tomorrow and day after in Philippine Time (PHT - UTC+8)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const slotTimes = [
      { startHour: 9, startMin: 0, endHour: 9, endMin: 45 },
      { startHour: 10, startMin: 0, endHour: 10, endMin: 45 },
      { startHour: 11, startMin: 0, endHour: 11, endMin: 45 },
      { startHour: 13, startMin: 30, endHour: 14, endMin: 15 },
      { startHour: 15, startMin: 0, endHour: 15, endMin: 45 },
      { startHour: 16, startMin: 0, endHour: 16, endMin: 45 },
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

    console.log("Philippine healthcare doctors and appointment schedule seeded successfully!");
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
