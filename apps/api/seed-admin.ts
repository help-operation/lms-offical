/**
 * Run once to create the first SUPER_ADMIN account.
 * In the container:  node dist/seed-admin.js   (DATABASE_URL via -e)
 *
 * Admin login authenticates against the `admin_users` table (NOT `users`,
 * which is for phone/student auth).
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import { adminUsers } from './src/db/schema';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  const email = 'admin@skillkoro.com';
  const password = 'Admin@1234';
  const hash = await bcrypt.hash(password, 10);

  const [admin] = await db
    .insert(adminUsers)
    .values({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password: hash,
      role: 'SUPER_ADMIN',
      status: 'active',
    })
    .onConflictDoNothing()
    .returning({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role });

  if (admin) {
    console.log('✅ Admin created:', admin);
  } else {
    console.log('ℹ️  Admin already exists with that email.');
  }

  await pool.end();
}

main().catch(console.error);
