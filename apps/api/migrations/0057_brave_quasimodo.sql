ALTER TABLE "courses" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "rating_source" varchar(10) DEFAULT 'auto' NOT NULL;