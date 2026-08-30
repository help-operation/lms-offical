import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Applying 0016: add firstSeenAt, lastSeenAt, visitCount to user_course_interests...");
  await sql`ALTER TABLE "user_course_interests" RENAME COLUMN "seen_at" TO "last_seen_at"`;
  await sql`ALTER TABLE "user_course_interests" ADD COLUMN "first_seen_at" timestamp DEFAULT now() NOT NULL`;
  await sql`ALTER TABLE "user_course_interests" ADD COLUMN "visit_count" integer DEFAULT 1 NOT NULL`;
  console.log("✓ 0016 done");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
