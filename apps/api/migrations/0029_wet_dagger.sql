ALTER TYPE "public"."lead_source" ADD VALUE 'live_checkout';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "live_enrollment_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "live_course_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_live_enrollment_id_live_enrollments_id_fk" FOREIGN KEY ("live_enrollment_id") REFERENCES "public"."live_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE set null ON UPDATE no action;