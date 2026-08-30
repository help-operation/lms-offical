CREATE TYPE "public"."tracking_item_category" AS ENUM('core_tag', 'ecommerce_event', 'content_engagement', 'user_data', 'consent');--> statement-breakpoint
CREATE TABLE "tracking_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"category" "tracking_item_category" NOT NULL,
	"label" varchar(200) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_items_key_unique" UNIQUE("key")
);
