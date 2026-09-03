import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { Pool } from 'pg';

export const DB_TOKEN = 'DRIZZLE_DB';

// A stalled Postgres connection (network issue, server hang) would otherwise
// block a query forever, with nothing upstream (guards, interceptors) able to
// bound it. These pool-level timeouts cap connection acquisition and idle
// statement time so requests fail fast instead of hanging.
const DB_CONNECTION_TIMEOUT_MS = 15_000;
const DB_STATEMENT_TIMEOUT_MS = 15_000;

// `pg`'s default pool size is 10. The dashboard's overview endpoint alone can
// still fan out into ~35 concurrent queries even after consolidating its
// per-window queries (see DashboardService) — with only 10 connections, that
// burst (plus any other concurrent API traffic sharing this same pool) can
// queue past DB_CONNECTION_TIMEOUT_MS and fail. Raised as a second layer of
// headroom on top of that consolidation, not a replacement for it.
const DB_POOL_MAX = 30;

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL!,
          connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
          statement_timeout: DB_STATEMENT_TIMEOUT_MS,
          max: DB_POOL_MAX,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DbModule {}
