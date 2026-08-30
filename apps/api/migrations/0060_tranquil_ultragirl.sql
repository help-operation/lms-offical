DO $$ BEGIN CREATE TYPE "public"."recorded_course_type" AS ENUM('single', 'bundle'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "course_type" "recorded_course_type" DEFAULT 'single' NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_bundle_items" (
	"bundle_course_id" integer NOT NULL,
	"bundled_course_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "course_bundle_items_bundle_course_id_bundled_course_id_pk" PRIMARY KEY("bundle_course_id","bundled_course_id")
);--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "course_bundle_items" ADD CONSTRAINT "course_bundle_items_bundle_course_id_courses_id_fk" FOREIGN KEY ("bundle_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "course_bundle_items" ADD CONSTRAINT "course_bundle_items_bundled_course_id_courses_id_fk" FOREIGN KEY ("bundled_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
