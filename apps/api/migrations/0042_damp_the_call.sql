CREATE TABLE "live_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"live_enrollment_id" integer NOT NULL,
	"user_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"bkash_trx_id" varchar(100),
	"payer_phone" varchar(20),
	"status" "payment_status" DEFAULT 'completed' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"display_invoice_number" varchar(40),
	CONSTRAINT "live_payments_display_invoice_number_unique" UNIQUE("display_invoice_number")
);
--> statement-breakpoint
ALTER TABLE "live_payments" ADD CONSTRAINT "live_payments_live_enrollment_id_live_enrollments_id_fk" FOREIGN KEY ("live_enrollment_id") REFERENCES "public"."live_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_payments" ADD CONSTRAINT "live_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;