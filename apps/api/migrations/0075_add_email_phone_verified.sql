ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Safe data migration: mark existing users as verified based on heuristics.
-- Users who signed up via email/phone OTP already proved contact ownership.
UPDATE "users" SET "email_verified" = true WHERE "email" IS NOT NULL;--> statement-breakpoint
UPDATE "users" SET "phone_verified" = true WHERE "phone" IS NOT NULL;
