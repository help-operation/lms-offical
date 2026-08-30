ALTER TABLE "courses" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "batch_info" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "tools_info" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "tools_title" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "why_different_info" json DEFAULT '{"features":[],"stats":[]}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "instructors_info" json DEFAULT '{"instructors":[]}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "benefits_title" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "benefits_info" json DEFAULT '{"items":[]}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "video_testimonials_info" json DEFAULT '{"items":[]}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "testimonials_info" json DEFAULT '{"items":[]}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "value_breakdown_info" json DEFAULT '{"items":[]}'::json;