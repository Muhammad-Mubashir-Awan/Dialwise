/** CSV exports of leads and call history, streamed in batches so a big export never sits in memory at once. */
import { and, asc, eq, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { csvLine } from "@/lib/csv";
import type { AppDatabase } from "@/lib/db/client";
import { calls, leads, lists } from "@/lib/db/schema";
import { OUTCOME_META, STATUS_META } from "@/lib/outcomes";

export type ExportType = "leads" | "calls";

const iso = (date: Date | null) => date?.toISOString() ?? null;

const LEAD_COLUMNS = [
  "Name",
  "Company",
  "Role",
  "Phone",
  "Phone as entered",
  "Country",
  "Time zone",
  "Email",
  "Website",
  "List",
  "Tags",
  "Status",
  "Last call",
  "Next follow-up",
  "Notes",
  "Source",
  "Added",
];

const CALL_COLUMNS = [
  "Called at",
  "Lead",
  "Company",
  "Phone",
  "Outcome",
  "Note",
  "Follow-up",
  "List",
  "Channel",
  "Duration (s)",
];

type Cursor = { at: Date; id: string } | null;
type Batch = { lines: string; next: Cursor };

/**
 * Times cut to milliseconds. Postgres keeps microseconds but the cursor comes back as a JavaScript Date
 * (milliseconds), and leads added in one import share a timestamp; comparing at the same precision is what
 * keeps batches from repeating rows.
 */
const toMs = (time: AnyPgColumn) => sql`date_trunc('milliseconds', ${time})`;

/** Rows after the cursor, ordered by (time, id), so batches never repeat or skip a row. */
const after = (time: AnyPgColumn, id: AnyPgColumn, cursor: Cursor) =>
  cursor ? sql`(${toMs(time)}, ${id}) > (${cursor.at}, ${cursor.id})` : undefined;

async function leadBatch(db: AppDatabase, listId: string | null, cursor: Cursor, limit: number): Promise<Batch> {
  const rows = await db
    .select({ lead: leads, listName: lists.name })
    .from(leads)
    .leftJoin(lists, eq(lists.id, leads.listId))
    .where(and(listId ? eq(leads.listId, listId) : undefined, after(leads.createdAt, leads.id, cursor)))
    .orderBy(toMs(leads.createdAt), asc(leads.id))
    .limit(limit);
  const lines = rows
    .map(({ lead, listName }) =>
      csvLine([
        lead.name,
        lead.company,
        lead.role,
        lead.phoneE164,
        lead.phoneRaw,
        lead.country,
        lead.timezone,
        lead.email,
        lead.website,
        listName,
        lead.tags.join(", "),
        STATUS_META[lead.status].label,
        iso(lead.lastCalledAt),
        iso(lead.nextFollowUpAt),
        lead.notes,
        lead.source,
        iso(lead.createdAt),
      ]),
    )
    .join("");
  const last = rows.at(-1)?.lead;
  return { lines, next: rows.length === limit && last ? { at: last.createdAt, id: last.id } : null };
}

async function callBatch(db: AppDatabase, listId: string | null, cursor: Cursor, limit: number): Promise<Batch> {
  const rows = await db
    .select({
      call: calls,
      lead: { name: leads.name, company: leads.company, phone: leads.phoneE164 },
      listName: lists.name,
    })
    .from(calls)
    .innerJoin(leads, eq(leads.id, calls.leadId))
    .leftJoin(lists, eq(lists.id, leads.listId))
    .where(and(listId ? eq(leads.listId, listId) : undefined, after(calls.calledAt, calls.id, cursor)))
    .orderBy(toMs(calls.calledAt), asc(calls.id))
    .limit(limit);
  const lines = rows
    .map(({ call, lead, listName }) =>
      csvLine([
        iso(call.calledAt),
        lead.name,
        lead.company,
        lead.phone,
        OUTCOME_META[call.outcome].label,
        call.note,
        iso(call.followUpAt),
        listName,
        call.channel,
        call.durationSec,
      ]),
    )
    .join("");
  const last = rows.at(-1)?.call;
  return { lines, next: rows.length === limit && last ? { at: last.calledAt, id: last.id } : null };
}

/** The whole export as a stream: a byte-order mark (so Excel reads UTF-8), the header, then batch after batch. */
export function exportCsv(
  db: AppDatabase,
  { type, listId, batchSize = 1_000 }: { type: ExportType; listId: string | null; batchSize?: number },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const fetchBatch = type === "leads" ? leadBatch : callBatch;
  let cursor: Cursor = null;
  let started = false;
  return new ReadableStream({
    async pull(controller) {
      if (!started) {
        started = true;
        controller.enqueue(encoder.encode(`﻿${csvLine(type === "leads" ? LEAD_COLUMNS : CALL_COLUMNS)}`));
      }
      const batch = await fetchBatch(db, listId, cursor, batchSize);
      if (batch.lines) controller.enqueue(encoder.encode(batch.lines));
      cursor = batch.next;
      if (!cursor) controller.close();
    },
  });
}
