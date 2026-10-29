CREATE TYPE "public"."call_channel" AS ENUM('manual', 'dialer');--> statement-breakpoint
CREATE TYPE "public"."call_outcome" AS ENUM('no_answer', 'voicemail', 'gatekeeper', 'callback', 'interested', 'meeting_booked', 'not_interested', 'wrong_number', 'do_not_call');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'callback', 'interested', 'meeting_booked', 'not_interested', 'do_not_call', 'bad_number');--> statement-breakpoint
CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"outcome" "call_outcome" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"follow_up_at" timestamp with time zone,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL,
	"channel" "call_channel" DEFAULT 'manual' NOT NULL,
	"duration_sec" integer,
	"external_id" text,
	CONSTRAINT "calls_external_id_unique" UNIQUE("external_id"),
	CONSTRAINT "calls_duration_non_negative" CHECK ("calls"."duration_sec" is null or "calls"."duration_sec" >= 0)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid,
	"name" text NOT NULL,
	"role" text,
	"company" text,
	"phone_e164" text NOT NULL,
	"phone_raw" text NOT NULL,
	"country" text,
	"timezone" text,
	"email" text,
	"website" text,
	"notes" text,
	"source" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"last_called_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_phone_e164_unique" UNIQUE("phone_e164"),
	CONSTRAINT "leads_phone_e164_format" CHECK ("leads"."phone_e164" ~ '^\+[1-9][0-9]{7,14}$'),
	CONSTRAINT "leads_country_format" CHECK ("leads"."country" is null or "leads"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"call_window_start" time DEFAULT '09:00' NOT NULL,
	"call_window_end" time DEFAULT '18:00' NOT NULL,
	"call_days" smallint[] DEFAULT '{1,2,3,4,5}'::smallint[] NOT NULL,
	"retry_gap_hours" smallint DEFAULT 24 NOT NULL,
	"default_country" text DEFAULT 'GB' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1),
	CONSTRAINT "settings_call_window_order" CHECK ("settings"."call_window_start" < "settings"."call_window_end"),
	CONSTRAINT "settings_call_days_range" CHECK ("settings"."call_days" <@ '{0,1,2,3,4,5,6}'::smallint[]),
	CONSTRAINT "settings_retry_gap_range" CHECK ("settings"."retry_gap_hours" between 1 and 168),
	CONSTRAINT "settings_default_country_format" CHECK ("settings"."default_country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calls_lead_id_called_at_idx" ON "calls" USING btree ("lead_id","called_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "calls_called_at_idx" ON "calls" USING btree ("called_at");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_list_id_idx" ON "leads" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX "leads_next_follow_up_at_idx" ON "leads" USING btree ("next_follow_up_at");--> statement-breakpoint
CREATE INDEX "leads_last_called_at_idx" ON "leads" USING btree ("last_called_at");--> statement-breakpoint
CREATE INDEX "leads_tags_idx" ON "leads" USING gin ("tags");