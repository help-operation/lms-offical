/**
 * Run once to create a test STUDENT account.
 * In the container:  node dist/seed-student.js   (DATABASE_URL via -e)
 *
 * Student login authenticates against the `users` table (NOT `admin_users`,
 * which is for admin/instructor email auth).
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import { users } from './src/db/schema';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  const email = 'student@skillkoro.com';
  const password = 'Student@1234';
  const hash = await bcrypt.hash(password, 10);

  const [student] = await db
    .insert(users)
    .values({
      firstName: 'Test',
      lastName: 'Student',
      email,
      password: hash,
      role: 'STUDENT',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning({ id: users.id, email: users.email, role: users.role });

  if (student) {
    console.log('✅ Student created:', student);
  } else {
    console.log('ℹ️  Student already exists with that email.');
  }

  await pool.end();
}

main().catch(console.error);
