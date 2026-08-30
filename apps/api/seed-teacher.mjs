/**
 * Creates the first INSTRUCTOR account.
 * Run: node seed-teacher.mjs
 *
 * Requires DATABASE_URL in apps/api/.env
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not found — rely on environment variables already set
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add it to apps/api/.env');
  process.exit(1);
}

const { neon } = await import('@neondatabase/serverless');
const bcrypt = await import('bcrypt');

const sql = neon(DATABASE_URL);

const email = 'teacher@skillkoro.com';
const password = 'Teacher@1234';
const hash = await bcrypt.hash(password, 10);

const rows = await sql`
  INSERT INTO users (first_name, last_name, email, password, role, status)
  VALUES ('Demo', 'Teacher', ${email}, ${hash}, 'INSTRUCTOR', 'active')
  ON CONFLICT (email) DO NOTHING
  RETURNING id, email, role
`;

if (rows.length > 0) {
  console.log('✅ Teacher created:', rows[0]);
} else {
  console.log('ℹ️  Teacher already exists with that email.');
}
