DO $$ BEGIN
  ALTER TYPE "public"."broadcast_job_status" ADD VALUE 'scheduled' BEFORE 'pending';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."broadcast_job_status" ADD VALUE 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'queued' BEFORE 'sent';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'delivered' BEFORE 'failed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."broadcast_recipient_status" ADD VALUE 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_jobs" ADD COLUMN "scheduled_at" timestamp;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_jobs" ADD COLUMN "interval_seconds" integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_jobs" ADD COLUMN "last_sent_at" timestamp;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_recipients" ADD COLUMN "delivered_at" timestamp;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sms_templates" ADD COLUMN "template_type" varchar(20) DEFAULT 'sms' NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;