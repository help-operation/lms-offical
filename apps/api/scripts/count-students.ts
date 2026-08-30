import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const res = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'");
  console.log('🎉 TOTAL STUDENTS IN DATABASE:', res.rows[0].count);
  await pool.end();
}

main().catch(console.error);
