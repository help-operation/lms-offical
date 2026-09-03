import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Find the latest migration file
  const migrationDir = resolve(__dirname, '../migrations');
  const files = readdirSync(migrationDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const latestFile = files[files.length - 1];
  console.log(`Running migration: ${latestFile}`);

  const sqlPath = resolve(migrationDir, latestFile);
  const sql = readFileSync(sqlPath, 'utf8');

  // Split by statement-breakpoint comments and filter empty
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      console.log(`✅ OK: ${stmt.substring(0, 80)}...`);
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log(`⏭️  Skip (already exists): ${stmt.substring(0, 60)}...`);
      } else {
        console.error(`❌ Error: ${stmt.substring(0, 80)}`);
        console.error(`   ${err.message}`);
      }
    }
  }

  await pool.end();
  console.log('\nDone!');
}

main();
