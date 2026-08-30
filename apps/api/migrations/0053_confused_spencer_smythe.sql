ALTER TABLE "live_courses" ADD COLUMN "t6_credentials" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_stats" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_comparison" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_organs" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_instructor" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_who_for" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_pricing" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_video" varchar(500);--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "t6_testimonials" json DEFAULT '[]'::json;