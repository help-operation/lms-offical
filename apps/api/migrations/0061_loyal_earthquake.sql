ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "bundle_curriculum" json DEFAULT '[]' NOT NULL;
