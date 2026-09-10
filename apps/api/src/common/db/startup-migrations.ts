/**
 * Run hand-written SQL migrations (0069-0072) on API startup.
 * All statements use ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS
 * so they are safe to re-run on every boot.
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const SQL_FILE = path.resolve(__dirname, '../migrations/0069-0072_production_safe.sql');

export async function runStartupMigrations(pool: Pool): Promise<void> {
  if (!fs.existsSync(SQL_FILE)) {
    console.log('[migrate] 0069-0072 SQL not found — skipping');
    return;
  }

  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    await client.query(sql);
    console.log('[migrate] 0069-0072 applied successfully');
  } catch (err) {
    // Log but don't crash — the app can still start with partial schema
    console.error('[migrate] 0069-0072 failed (non-fatal):', (err as Error).message);
  } finally {
    client.release();
  }
}
