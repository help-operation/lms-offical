import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const MIGRATIONS_FOLDER = path.resolve(__dirname, "../migrations");

function getMigrationHash(tag: string): string {
  const filePath = path.join(MIGRATIONS_FOLDER, `${tag}.sql`);
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  const url = process.env.DATABASE_URL!;
  const wantsSsl = new URL(url).searchParams.get("sslmode") === "require";
  const pool = new Pool({
    connectionString: url,
    ssl: wantsSsl ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const journal = JSON.parse(
      fs.readFileSync(path.join(MIGRATIONS_FOLDER, "meta/_journal.json"), "utf8")
    );

    const { rows } = await client.query<{ hash: string }>(
      `SELECT hash FROM drizzle."__drizzle_migrations"`
    );

    if (rows.length === 0) {
      // Tracker is empty → this is a fresh environment where the DB was already
      // populated via db:push (or a manual restore). Seed every journal entry as
      // "already applied" so that migrate() below does not re-run them.
      let seeded = 0;
      for (const entry of journal.entries as { tag: string; when: number }[]) {
        const hash = getMigrationHash(entry.tag);
        await client.query(
          `INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
          [hash, entry.when]
        );
        seeded++;
      }
      console.log(`✓ Fresh environment detected — seeded ${seeded} baseline migration(s) into tracker`);
    } else {
      // Tracker already has entries. Let Drizzle's migrate() handle new migrations.
      // Do NOT seed untracked entries here — seeding without running causes
      // "column does not exist" bugs for new migrations.
      console.log(`✓ Migration tracker has ${rows.length} recorded migration(s)`);
    }
  } finally {
    client.release();
  }

  const db = drizzle(pool);
  console.log("Running pending migrations…");
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log("✓ All migrations applied");

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
