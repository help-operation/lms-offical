ALTER TABLE "live_enrollments" ADD COLUMN "payer_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payer_phone" varchar(20);