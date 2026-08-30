CREATE TABLE "live_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"live_course_id" integer NOT NULL,
	"certificate_code" varchar(100) NOT NULL,
	"certificate_url" varchar(500),
	"issued_at" timestamp DEFAULT now(),
	CONSTRAINT "live_certificates_certificate_code_unique" UNIQUE("certificate_code"),
	CONSTRAINT "uq_live_cert_user_course" UNIQUE("user_id","live_course_id")
);
--> statement-breakpoint
CREATE TABLE "live_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"live_course_id" integer NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_live_lesson_progress_user_lesson" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "require_sequential_progress" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "live_certificates" ADD CONSTRAINT "live_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_certificates" ADD CONSTRAINT "live_certificates_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_progress" ADD CONSTRAINT "live_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_progress" ADD CONSTRAINT "live_lesson_progress_lesson_id_live_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."live_course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_progress" ADD CONSTRAINT "live_lesson_progress_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;