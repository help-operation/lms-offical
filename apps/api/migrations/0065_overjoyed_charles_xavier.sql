CREATE TABLE "communication_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" "broadcast_channel" NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "communication_balances_channel_unique" UNIQUE("channel")
);
--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_admin_user_id_idx" ON "activity_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs" USING btree ("user_id");