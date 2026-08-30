ALTER TYPE "public"."live_course_lesson_type" ADD VALUE 'quiz';--> statement-breakpoint
ALTER TYPE "public"."live_course_lesson_type" ADD VALUE 'assignment';--> statement-breakpoint
CREATE TABLE "live_lesson_assignment_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"content" text,
	"file_url" varchar(500),
	"status" "submission_status" DEFAULT 'submitted' NOT NULL,
	"grade" numeric(5, 2),
	"feedback" text,
	"submitted_at" timestamp DEFAULT now(),
	"graded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "live_lesson_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer,
	"live_course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_lesson_quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_lesson_quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"quiz_id" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_lesson_quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question" text NOT NULL,
	"type" "quiz_question_type" DEFAULT 'single' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_lesson_quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer,
	"live_course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "live_lesson_assignment_submissions" ADD CONSTRAINT "live_lesson_assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_assignment_submissions" ADD CONSTRAINT "live_lesson_assignment_submissions_assignment_id_live_lesson_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."live_lesson_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_assignments" ADD CONSTRAINT "live_lesson_assignments_lesson_id_live_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."live_course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_assignments" ADD CONSTRAINT "live_lesson_assignments_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quiz_answers" ADD CONSTRAINT "live_lesson_quiz_answers_question_id_live_lesson_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."live_lesson_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quiz_attempts" ADD CONSTRAINT "live_lesson_quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quiz_attempts" ADD CONSTRAINT "live_lesson_quiz_attempts_quiz_id_live_lesson_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."live_lesson_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quiz_questions" ADD CONSTRAINT "live_lesson_quiz_questions_quiz_id_live_lesson_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."live_lesson_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quizzes" ADD CONSTRAINT "live_lesson_quizzes_lesson_id_live_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."live_course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_lesson_quizzes" ADD CONSTRAINT "live_lesson_quizzes_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;