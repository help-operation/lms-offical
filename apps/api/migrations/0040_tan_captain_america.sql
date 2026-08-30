ALTER TYPE "public"."course_status" ADD VALUE 'inactive';--> statement-breakpoint
ALTER TYPE "public"."course_status" ADD VALUE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."course_status" ADD VALUE 'trash';--> statement-breakpoint
ALTER TYPE "public"."live_course_status" ADD VALUE 'inactive';--> statement-breakpoint
ALTER TYPE "public"."live_course_status" ADD VALUE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."live_course_status" ADD VALUE 'trash';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "publish_at" timestamp;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "access_duration_days" integer;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "status_reason" text;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "publish_at" timestamp;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "has_lifetime_access" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "access_duration_days" integer;--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "status_reason" text;