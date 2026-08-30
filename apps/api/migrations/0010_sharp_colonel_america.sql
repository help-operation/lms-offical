ALTER TABLE "lesson_resources" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "content" text;