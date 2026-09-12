-- 0077: Blog featured, scheduling, reading time support

-- Add is_featured column
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Add publish_at column (for scheduled publishing, separate from published_at)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS publish_at timestamp;

-- Extend blog_status enum to include 'scheduled'
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE blog_posts ALTER COLUMN status TYPE varchar(20);
ALTER TABLE blog_posts ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'scheduled', 'published'));
