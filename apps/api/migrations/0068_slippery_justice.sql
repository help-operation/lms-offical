DO $$ BEGIN
  ALTER TABLE "message_broadcast_recipients" ADD COLUMN "rendered_message" text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_recipients" ADD COLUMN "sent_by_admin_id" integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "message_broadcast_recipients" ADD CONSTRAINT "message_broadcast_recipients_sent_by_admin_id_admin_users_id_fk" FOREIGN KEY ("sent_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;