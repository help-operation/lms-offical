import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Applying 0018: add live_course_id, partial unique indexes...");

  await sql`ALTER TABLE "user_course_interests" ALTER COLUMN "course_id" DROP NOT NULL`;
  console.log("✓ course_id made nullable");

  await sql`ALTER TABLE "user_course_interests" ADD COLUMN IF NOT EXISTS "live_course_id" integer REFERENCES "live_courses"("id") ON DELETE CASCADE`;
  console.log("✓ live_course_id column added");

  await sql`ALTER TABLE "user_course_interests" DROP CONSTRAINT IF EXISTS "user_course_interests_uniq"`;
  console.log("✓ old unique constraint dropped");

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "uci_user_course" ON "user_course_interests" ("user_id", "course_id") WHERE "course_id" IS NOT NULL`;
  console.log("✓ partial index uci_user_course created");

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "uci_user_live_course" ON "user_course_interests" ("user_id", "live_course_id") WHERE "live_course_id" IS NOT NULL`;
  console.log("✓ partial index uci_user_live_course created");

  await sql`ALTER TABLE "user_course_interests" DROP CONSTRAINT IF EXISTS "uci_one_course_type"`;
  await sql`ALTER TABLE "user_course_interests" ADD CONSTRAINT "uci_one_course_type" CHECK (
    ("course_id" IS NOT NULL AND "live_course_id" IS NULL) OR
    ("course_id" IS NULL AND "live_course_id" IS NOT NULL)
  )`;
  console.log("✓ check constraint uci_one_course_type added");

  console.log("✓ 0018 done");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
