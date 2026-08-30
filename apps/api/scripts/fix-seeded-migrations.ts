/**
 * One-time fix for environments where migrations 0021–0023 were seeded into
 * the tracker without their SQL being executed.
 *
 * Run once on any affected environment:
 *   pnpm --filter api tsx scripts/fix-seeded-migrations.ts
 *
 * Safe to re-run — all migration SQL uses IF NOT EXISTS / IF EXISTS guards.
 */
import "dotenv/config";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const MIGRATIONS_FOLDER = path.resolve(__dirname, "../migrations");

const AFFECTED_TAGS = [
  "0021_needy_butterfly",
  "0022_rainy_ink",
  "0023_clear_scorpion",
];

function getMigrationHash(tag: string): string {
  const filePath = path.join(MIGRATIONS_FOLDER, `${tag}.sql`);
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readSql(tag: string): string {
  return fs
    .readFileSync(path.join(MIGRATIONS_FOLDER, `${tag}.sql`), "utf8")
    .replace(/--> statement-breakpoint/g, "");
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    for (const tag of AFFECTED_TAGS) {
      const hash = getMigrationHash(tag);
      const sql = readSql(tag);

      // Remove the incorrectly seeded tracker entry
      const del = await client.query(
        `DELETE FROM drizzle."__drizzle_migrations" WHERE hash = $1`,
        [hash]
      );
      if (del.rowCount && del.rowCount > 0) {
        console.log(`  Removed stale tracker entry for ${tag}`);
      }

      // Actually execute the migration SQL
      await client.query(sql);
      console.log(`✓ ${tag} — SQL applied`);
    }
  } finally {
    client.release();
  }

  // Now run migrate() so it re-records them with the correct timestamps
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log("✓ Tracker re-synced via migrate()");

  await pool.end();
}

main().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
