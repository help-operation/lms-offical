ALTER TABLE "courses" ALTER COLUMN "template" SET DEFAULT '2';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "style_overrides" json DEFAULT '{}'::json;