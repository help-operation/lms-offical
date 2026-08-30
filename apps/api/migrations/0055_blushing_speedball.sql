CREATE TYPE "public"."broadcast_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."broadcast_job_status" AS ENUM('pending', 'running', 'completed');--> statement-breakpoint
CREATE TYPE "public"."broadcast_recipient_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "message_broadcast_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "broadcast_channel" NOT NULL,
	"subject" varchar(255),
	"message" text NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"sent" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"status" "broadcast_job_status" DEFAULT 'pending' NOT NULL,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "message_broadcast_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"status" "broadcast_recipient_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "message_broadcast_jobs" ADD CONSTRAINT "message_broadcast_jobs_created_by_admin_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_broadcast_recipients" ADD CONSTRAINT "message_broadcast_recipients_job_id_message_broadcast_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."message_broadcast_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_broadcast_recipients" ADD CONSTRAINT "message_broadcast_recipients_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;