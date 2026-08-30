ALTER TYPE "public"."payment_method" ADD VALUE 'bkash_pgw';--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "bkash_invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "bkash_payment_id" varchar(100);--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "bkash_pgw_trx_id" varchar(100);--> statement-breakpoint
ALTER TABLE "live_enrollments" ADD COLUMN "bkash_pgw_status" varchar(30);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bkash_invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bkash_payment_id" varchar(100);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bkash_pgw_trx_id" varchar(100);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "bkash_pgw_status" varchar(30);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "bkash_invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "bkash_payment_id" varchar(100);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "bkash_pgw_trx_id" varchar(100);--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "bkash_pgw_status" varchar(30);