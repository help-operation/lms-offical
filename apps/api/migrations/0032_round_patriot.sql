CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."visit_device" AS ENUM('mobile', 'tablet', 'desktop', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."visit_source" AS ENUM('facebook', 'youtube', 'website', 'linkedin', 'twitter', 'instagram', 'direct', 'other');--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"path" varchar(500) NOT NULL,
	"referrer" varchar(1000),
	"source" "visit_source" DEFAULT 'direct' NOT NULL,
	"device" "visit_device" DEFAULT 'unknown' NOT NULL,
	"user_agent" varchar(500),
	"country" varchar(100),
	"city" varchar(100),
	"user_id" integer,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;