CREATE TABLE "custom_fonts" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_name" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'sans-serif' NOT NULL,
	"weights" json DEFAULT '[400]'::json NOT NULL,
	"subsets" json DEFAULT '["latin"]'::json NOT NULL,
	"style" varchar(50) DEFAULT 'normal' NOT NULL,
	"format" varchar(10) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "custom_fonts_family_name_unique" UNIQUE("family_name"),
	CONSTRAINT "custom_fonts_file_hash_unique" UNIQUE("file_hash")
);
--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_view_item" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_view_item_list" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_select_item" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_add_to_cart" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_remove_from_cart" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_begin_checkout" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_purchase" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_sign_up" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tracking_settings" ADD COLUMN "event_login" boolean DEFAULT true NOT NULL;