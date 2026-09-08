// apps/api/src/db/index.ts

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env and configure your database connection.",
  );
}
const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export type DB = typeof db;