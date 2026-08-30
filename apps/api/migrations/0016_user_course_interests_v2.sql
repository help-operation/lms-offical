DO $$ BEGIN
  ALTER TABLE "user_course_interests" RENAME COLUMN "seen_at" TO "last_seen_at";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "user_course_interests" ADD COLUMN IF NOT EXISTS "first_seen_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_interests" ADD COLUMN IF NOT EXISTS "visit_count" integer DEFAULT 1 NOT NULL;
