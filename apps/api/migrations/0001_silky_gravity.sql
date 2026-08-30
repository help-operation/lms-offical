ALTER TABLE "live_enrollments" ADD COLUMN "confirmation_sms_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmation_sms_sent_at" timestamp;