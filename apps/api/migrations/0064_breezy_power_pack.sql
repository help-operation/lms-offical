ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "bundle_curriculum" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "bundle_curriculum_header" json DEFAULT '{"title":"কোর্স কারিকুলাম","moduleLabel":"মডিউল","courseTypeLabel":"রেকর্ডেড কোর্স"}'::json;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "mastery_checkout_image" varchar(1000);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "mastery_section_order" json DEFAULT '[]'::json;
