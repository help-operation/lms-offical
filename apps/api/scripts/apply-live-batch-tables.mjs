// One-off DDL to add the live-course batch dashboard tables.
// Purely additive (new enums + tables), safe to run multiple times.
import fs from "fs";
import { neon } from "@neondatabase/serverless";

const url = fs.readFileSync(new URL("../.env", import.meta.url), "utf8").match(/DATABASE_URL=(.*)/)[1].trim();
const sql = neon(url);

const statements = [
  `DO $$ BEGIN
     CREATE TYPE "live_session_status" AS ENUM ('scheduled','live','completed','cancelled');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  `DO $$ BEGIN
     CREATE TYPE "live_assignment_submission_status" AS ENUM ('submitted','graded');
   EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  `CREATE TABLE IF NOT EXISTS "live_sessions" (
     "id" serial PRIMARY KEY NOT NULL,
     "live_course_id" integer NOT NULL REFERENCES "live_courses"("id") ON DELETE cascade,
     "batch_id" integer NOT NULL REFERENCES "live_course_batches"("id") ON DELETE cascade,
     "title" varchar(255) NOT NULL,
     "description" text,
     "scheduled_at" timestamp NOT NULL,
     "duration_minutes" integer DEFAULT 60 NOT NULL,
     "meeting_url" varchar(1000),
     "status" "live_session_status" DEFAULT 'scheduled' NOT NULL,
     "recording_url" varchar(1000),
     "order" integer DEFAULT 0 NOT NULL,
     "created_at" timestamp DEFAULT now(),
     "updated_at" timestamp DEFAULT now()
   );`,

  `CREATE TABLE IF NOT EXISTS "live_session_attendance" (
     "session_id" integer NOT NULL REFERENCES "live_sessions"("id") ON DELETE cascade,
     "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
     "joined_at" timestamp DEFAULT now(),
     CONSTRAINT "live_session_attendance_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
   );`,

  `CREATE TABLE IF NOT EXISTS "live_course_resources" (
     "id" serial PRIMARY KEY NOT NULL,
     "live_course_id" integer NOT NULL REFERENCES "live_courses"("id") ON DELETE cascade,
     "batch_id" integer REFERENCES "live_course_batches"("id") ON DELETE cascade,
     "title" varchar(255) NOT NULL,
     "file_url" varchar(1000) NOT NULL,
     "file_type" varchar(50),
     "order" integer DEFAULT 0 NOT NULL,
     "created_at" timestamp DEFAULT now()
   );`,

  `CREATE TABLE IF NOT EXISTS "live_assignments" (
     "id" serial PRIMARY KEY NOT NULL,
     "live_course_id" integer NOT NULL REFERENCES "live_courses"("id") ON DELETE cascade,
     "batch_id" integer NOT NULL REFERENCES "live_course_batches"("id") ON DELETE cascade,
     "title" varchar(255) NOT NULL,
     "description" text,
     "instructions_url" varchar(1000),
     "due_date" timestamp,
     "max_score" integer DEFAULT 100 NOT NULL,
     "created_at" timestamp DEFAULT now(),
     "updated_at" timestamp DEFAULT now()
   );`,

  `CREATE TABLE IF NOT EXISTS "live_assignment_submissions" (
     "id" serial PRIMARY KEY NOT NULL,
     "assignment_id" integer NOT NULL REFERENCES "live_assignments"("id") ON DELETE cascade,
     "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
     "submission_url" varchar(1000),
     "submission_text" text,
     "status" "live_assignment_submission_status" DEFAULT 'submitted' NOT NULL,
     "score" integer,
     "feedback" text,
     "submitted_at" timestamp DEFAULT now(),
     "graded_at" timestamp,
     CONSTRAINT "live_assignment_submissions_assignment_id_user_id_unique" UNIQUE("assignment_id","user_id")
   );`,
];

for (const [i, stmt] of statements.entries()) {
  await sql.query(stmt);
  console.log(`✓ statement ${i + 1}/${statements.length}`);
}
console.log("All live-batch tables applied.");
