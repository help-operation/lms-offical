// Standalone migration runner. Run on container boot before the API starts.

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[migrate] DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(pool);

  console.log('[migrate] applying migrations…');
  // cwd is /repo/apps/api at runtime → resolves to apps/api/migrations
  await migrate(db, { migrationsFolder: 'migrations' });
  console.log('[migrate] done ✓');
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] failed:', err);
    process.exit(1);
  });
