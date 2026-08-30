CREATE TABLE "role_course_assignments" (
	"role_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	CONSTRAINT "role_course_assignments_role_id_course_id_pk" PRIMARY KEY("role_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "role_live_course_assignments" (
	"role_id" integer NOT NULL,
	"live_course_id" integer NOT NULL,
	CONSTRAINT "role_live_course_assignments_role_id_live_course_id_pk" PRIMARY KEY("role_id","live_course_id")
);
--> statement-breakpoint
ALTER TABLE "role_course_assignments" ADD CONSTRAINT "role_course_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_course_assignments" ADD CONSTRAINT "role_course_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_live_course_assignments" ADD CONSTRAINT "role_live_course_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_live_course_assignments" ADD CONSTRAINT "role_live_course_assignments_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;