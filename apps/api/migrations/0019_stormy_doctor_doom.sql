DO $$ BEGIN
  ALTER TABLE "user_course_interests" DROP CONSTRAINT "user_course_interests_uniq";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "user_course_interests" ALTER COLUMN "course_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_interests" ADD COLUMN IF NOT EXISTS "live_course_id" integer;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_course_interests" ADD CONSTRAINT "user_course_interests_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
