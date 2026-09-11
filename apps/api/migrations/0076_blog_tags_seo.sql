-- 0076: Add blog tags + SEO fields

-- SEO columns on blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title varchar(255);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image varchar(500);

-- Blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  slug varchar(120) NOT NULL UNIQUE
);

-- Many-to-many pivot
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id integer NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  integer NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
