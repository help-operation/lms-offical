CREATE TYPE "public"."live_subscription_status" AS ENUM('pending', 'active', 'past_due', 'cancelled', 'expired', 'paused');--> statement-breakpoint
CREATE TABLE "live_subscription_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"gateway_invoice_id" varchar(100),
	"gateway_transaction_id" varchar(100),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"gateway_response" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"live_course_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"user_id" integer,
	"batch_id" integer,
	"gateway" varchar(30) NOT NULL,
	"gateway_subscription_id" varchar(255),
	"monthly_price" numeric(10, 2) NOT NULL,
	"status" "live_subscription_status" DEFAULT 'pending' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"next_billing_at" timestamp NOT NULL,
	"last_payment_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "has_subscription" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "live_courses" ADD COLUMN "monthly_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "payment_mode" varchar(20) DEFAULT 'one_time' NOT NULL;--> statement-breakpoint
ALTER TABLE "live_subscription_payments" ADD CONSTRAINT "live_subscription_payments_subscription_id_live_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."live_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_subscriptions" ADD CONSTRAINT "live_subscriptions_live_course_id_live_courses_id_fk" FOREIGN KEY ("live_course_id") REFERENCES "public"."live_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_subscriptions" ADD CONSTRAINT "live_subscriptions_enrollment_id_live_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."live_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_subscriptions" ADD CONSTRAINT "live_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_subscriptions" ADD CONSTRAINT "live_subscriptions_batch_id_live_course_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."live_course_batches"("id") ON DELETE set null ON UPDATE no action;