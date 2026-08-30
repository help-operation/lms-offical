import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS template varchar(5) DEFAULT '1' NOT NULL`);
    console.log("✓ Column 'template' added to courses table");
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

main();
