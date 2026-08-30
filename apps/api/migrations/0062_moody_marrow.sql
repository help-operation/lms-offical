ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "bundle_curriculum_header" json DEFAULT '{"title":"কোর্স কারিকুলাম","moduleLabel":"মডিউল","courseTypeLabel":"রেকর্ডেড কোর্স"}' NOT NULL;
