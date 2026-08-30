CREATE TABLE "invoice_number_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "display_invoice_number" varchar(40);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "display_invoice_number" varchar(40);--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD CONSTRAINT "live_enrollments_display_invoice_number_unique" UNIQUE("display_invoice_number");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_display_invoice_number_unique" UNIQUE("display_invoice_number");