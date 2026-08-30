CREATE TABLE "payment_gateway_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"gateway" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_gateway_configs_gateway_unique" UNIQUE("gateway")
);
