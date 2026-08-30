CREATE TABLE "live_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"content" text NOT NULL,
	"video_timestamp" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "live_notes" ADD CONSTRAINT "live_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_notes" ADD CONSTRAINT "live_notes_lesson_id_live_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."live_course_lessons"("id") ON DELETE cascade ON UPDATE no action;