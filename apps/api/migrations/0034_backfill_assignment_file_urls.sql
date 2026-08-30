-- Custom SQL migration file, put your code below! --

-- Copy legacy single fileUrl into the new fileUrls array so existing
-- submissions keep their attached link after the multi-file change.
UPDATE "assignment_submissions"
SET "file_urls" = jsonb_build_array("file_url")
WHERE "file_url" IS NOT NULL AND "file_urls" = '[]'::jsonb;
