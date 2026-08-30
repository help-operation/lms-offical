ALTER TYPE "public"."enrollment_status" ADD VALUE 'suspended';--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "expires_at" timestamp;