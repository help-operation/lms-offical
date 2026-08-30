// Applies migrations 0014 and 0015 directly to the DB.
// Run with: node --env-file=.env scripts/apply-0014-0015.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Applying 0014: add abandoned_checkout + checkout_visit enum values...");
  // ALTER TYPE ... ADD VALUE cannot run inside a transaction in Postgres
  await sql`ALTER TYPE "public"."lead_source" ADD VALUE IF NOT EXISTS 'abandoned_checkout'`;
  await sql`ALTER TYPE "public"."lead_source" ADD VALUE IF NOT EXISTS 'checkout_visit'`;
  console.log("✓ 0014 done");

  console.log("Applying 0015: create user_course_interests table...");
  // Create table + unique constraint in one shot; skip if already exists
  await sql`
    CREATE TABLE IF NOT EXISTS "user_course_interests" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
      "course_id" integer NOT NULL REFERENCES "public"."courses"("id") ON DELETE cascade,
      "seen_at" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "user_course_interests_uniq" UNIQUE("user_id","course_id")
    )
  `;
  console.log("✓ 0015 done");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
