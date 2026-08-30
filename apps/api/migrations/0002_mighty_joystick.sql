ALTER TABLE "live_courses" ADD COLUMN "section_headings" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "section_order" json DEFAULT '[]'::json;