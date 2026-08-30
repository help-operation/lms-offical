CREATE TYPE "public"."live_course_type" AS ENUM('live', 'bundle');--> statement-breakpoint
CREATE TABLE "live_course_recorded_bundles" (
	"live_course_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "live_course_recorded_bundles_live_course_id_course_id_pk" PRIMARY KEY("live_course_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "course_type" "live_course_type" DEFAULT 'live' NOT NULL;--> statement-breakpoint
ALTER TABLE "live_course_recorded_bundles" ADD CONSTRAINT "live_course_recorded_bundles_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_course_recorded_bundles" ADD CONSTRAINT "live_course_recorded_bundles_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;