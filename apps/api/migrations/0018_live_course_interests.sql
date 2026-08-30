ALTER TABLE "user_course_interests" ALTER COLUMN "course_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_interests" ADD COLUMN IF NOT EXISTS "live_course_id" integer REFERENCES "live_courses"("id") ON DELETE CASCADE;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_course_interests" DROP CONSTRAINT "user_course_interests_uniq";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uci_user_course" ON "user_course_interests" ("user_id", "course_id") WHERE "course_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uci_user_live_course" ON "user_course_interests" ("user_id", "live_course_id") WHERE "live_course_id" IS NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_course_interests" ADD CONSTRAINT "uci_one_course_type" CHECK (
    ("course_id" IS NOT NULL AND "live_course_id" IS NULL) OR
    ("course_id" IS NULL AND "live_course_id" IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
