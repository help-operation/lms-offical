ALTER TYPE "public"."broadcast_job_status" ADD VALUE 'scheduled' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."broadcast_job_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'queued' BEFORE 'sent';--> statement-breakpoint
ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'delivered' BEFORE 'failed';--> statement-breakpoint
ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "message_broadcast_jobs" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "message_broadcast_jobs" ADD COLUMN "interval_seconds" integer;--> statement-breakpoint
ALTER TABLE "message_broadcast_jobs" ADD COLUMN "last_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "message_broadcast_recipients" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD COLUMN "template_type" varchar(20) DEFAULT 'sms' NOT NULL;