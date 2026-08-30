DO $$ BEGIN
  CREATE TYPE "public"."ticket_category" AS ENUM('billing', 'technical', 'course_content', 'certificate', 'refund', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN IF NOT EXISTS "is_internal" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN IF NOT EXISTS "attachments" jsonb;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "category" "ticket_category" DEFAULT 'other' NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_to" integer;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_admin_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
