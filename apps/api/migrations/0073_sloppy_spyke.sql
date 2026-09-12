-- Migration 0073: Fix users.avatar column size for Google OAuth avatar URLs
-- Google OAuth avatar URLs can exceed 500 characters (observed: 1125+ chars).
-- Change from varchar(500) to text to accommodate any URL length.
-- Idempotent: safe to re-run.

ALTER TABLE "users" ALTER COLUMN "avatar" SET DATA TYPE text;
