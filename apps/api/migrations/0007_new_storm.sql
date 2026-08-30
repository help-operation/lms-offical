-- Remove any pre-existing duplicate enrollments (keep the earliest row per
-- user+course) so the unique constraint below can be added safely on prod.
DELETE FROM "enrollments" a
USING "enrollments" b
WHERE a.user_id = b.user_id
  AND a.course_id = b.course_id
  AND a.id > b.id;
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_course_uniq" UNIQUE("user_id","course_id");
