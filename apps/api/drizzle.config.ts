import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and configure your database connection.");
  process.exit(1);
}

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: { url },
});
