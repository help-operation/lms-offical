ALTER TABLE "assignment_submissions" ADD COLUMN "file_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "max_files" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "files_required" boolean DEFAULT false NOT NULL;