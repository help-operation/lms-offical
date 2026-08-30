ALTER TYPE "public"."lead_source" ADD VALUE IF NOT EXISTS 'abandoned_checkout';
--> statement-breakpoint
ALTER TYPE "public"."lead_source" ADD VALUE IF NOT EXISTS 'checkout_visit';
