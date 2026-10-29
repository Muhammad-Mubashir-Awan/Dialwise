import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, smallint, text, time, timestamp, uuid } from "drizzle-orm/pg-core";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "callback",
  "interested",
  "meeting_booked",
  "not_interested",
  "do_not_call",
  "bad_number",
] as const;

export const CALL_OUTCOMES = [
  "no_answer",
  "voicemail",
  "gatekeeper",
  "callback",
  "interested",
  "meeting_booked",
  "not_interested",
  "wrong_number",
  "do_not_call",
] as const;

/** `dialer` is filled in by the phase-2 dialer module; core logs `manual` calls. */
export const CALL_CHANNELS = ["manual", "dialer"] as const;

export const leadStatus = pgEnum("lead_status", LEAD_STATUSES);
export const callOutcome = pgEnum("call_outcome", CALL_OUTCOMES);
export const callChannel = pgEnum("call_channel", CALL_CHANNELS);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => timestamptz("created_at").notNull().defaultNow();
const updatedAt = () =>
  timestamptz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id").references(() => lists.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** Job title, e.g. "Founder". */
    role: text("role"),
    company: text("company"),
    phoneE164: text("phone_e164").notNull().unique(),
    /** The number as it was entered or imported. */
    phoneRaw: text("phone_raw").notNull(),
    /** ISO 3166-1 alpha-2, e.g. "GB". */
    country: text("country"),
    /** IANA zone, e.g. "Europe/London"; null when unknown (the queue then ignores call hours). */
    timezone: text("timezone"),
    email: text("email"),
    website: text("website"),
    notes: text("notes"),
    source: text("source"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: leadStatus("status").notNull().default("new"),
    lastCalledAt: timestamptz("last_called_at"),
    nextFollowUpAt: timestamptz("next_follow_up_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("leads_status_idx").on(t.status),
    index("leads_list_id_idx").on(t.listId),
    index("leads_next_follow_up_at_idx").on(t.nextFollowUpAt),
    index("leads_last_called_at_idx").on(t.lastCalledAt),
    index("leads_tags_idx").using("gin", t.tags),
    check("leads_phone_e164_format", sql`${t.phoneE164} ~ '^\\+[1-9][0-9]{7,14}$'`),
    check("leads_country_format", sql`${t.country} is null or ${t.country} ~ '^[A-Z]{2}$'`),
  ],
);

export const calls = pgTable(
  "calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    outcome: callOutcome("outcome").notNull(),
    note: text("note").notNull().default(""),
    followUpAt: timestamptz("follow_up_at"),
    calledAt: timestamptz("called_at").notNull().defaultNow(),
    channel: callChannel("channel").notNull().default("manual"),
    durationSec: integer("duration_sec"),
    /** The calling provider's id for this call (set by the dialer module). */
    externalId: text("external_id").unique(),
  },
  (t) => [
    index("calls_lead_id_called_at_idx").on(t.leadId, t.calledAt.desc()),
    index("calls_called_at_idx").on(t.calledAt),
    check("calls_duration_non_negative", sql`${t.durationSec} is null or ${t.durationSec} >= 0`),
  ],
);

/** Single-row table (id is always 1); the first migration inserts the defaults. */
export const settings = pgTable(
  "settings",
  {
    id: smallint("id").primaryKey().default(1),
    callWindowStart: time("call_window_start").notNull().default("09:00"),
    callWindowEnd: time("call_window_end").notNull().default("18:00"),
    /** Days the queue serves calls, 0 = Sunday … 6 = Saturday. */
    callDays: smallint("call_days")
      .array()
      .notNull()
      .default(sql`'{1,2,3,4,5}'::smallint[]`),
    retryGapHours: smallint("retry_gap_hours").notNull().default(24),
    defaultCountry: text("default_country").notNull().default("GB"),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("settings_single_row", sql`${t.id} = 1`),
    check("settings_call_window_order", sql`${t.callWindowStart} < ${t.callWindowEnd}`),
    check("settings_call_days_range", sql`${t.callDays} <@ '{0,1,2,3,4,5,6}'::smallint[]`),
    check("settings_retry_gap_range", sql`${t.retryGapHours} between 1 and 168`),
    check("settings_default_country_format", sql`${t.defaultCountry} ~ '^[A-Z]{2}$'`),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type List = typeof lists.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
