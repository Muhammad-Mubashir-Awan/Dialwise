/**
 * The call queue: which leads to call now, in what order. Call hours are checked in the app for each distinct
 * time zone (the same code as the leads table), so the query doesn't depend on the database's time zone data.
 */
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNotNull,
  lte,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { type CallWindow, isInCallWindow, nextWindowOpen } from "@/lib/call-window";
import type { AppDatabase } from "@/lib/db/client";
import { type Call, type CallOutcome, calls, type Lead, leads, lists, type Settings } from "@/lib/db/schema";
import { CLOSED_STATUSES, RETRY_OUTCOMES } from "@/lib/outcomes";

export type QueueLead = Lead & {
  listName: string | null;
  lastCall: { outcome: CallOutcome; calledAt: Date } | null;
  /** Up to three, newest first. */
  recentCalls: Call[];
};

export type QueueCounts = { ready: number; outside: number; waiting: number; scheduled: number };

export type Queue = {
  ready: QueueLead[];
  counts: QueueCounts;
  /** The lead asked for with "Call now", ready or not. */
  pinned: QueueLead | null;
  pinnedProblem: "do_not_call" | "not_found" | null;
  /** When nobody is ready: the lead whose call hours open soonest. */
  nextOpen: { leadId: string; name: string; timezone: string; at: Date } | null;
};

export type QueueOptions = {
  now: Date;
  settings: Settings;
  listId?: string | null;
  pinnedId?: string | null;
  limit?: number;
};

export const callWindowOf = (s: Settings): CallWindow => ({
  start: s.callWindowStart,
  end: s.callWindowEnd,
  days: s.callDays,
});

const isUuid = (id: string) => z.uuid().safeParse(id).success;

/** Splits the time zones in use into open (in call hours now) and closed. Unknown names count as open. */
async function zonesNow(db: AppDatabase, now: Date, window: CallWindow) {
  const rows = await db.selectDistinct({ zone: leads.timezone }).from(leads).where(isNotNull(leads.timezone));
  const closed: string[] = [];
  for (const { zone } of rows) {
    try {
      if (zone && !isInCallWindow(zone, now, window)) closed.push(zone);
    } catch {
      // Not a zone the runtime knows: treat like an unknown zone, which is always callable.
    }
  }
  return closed;
}

/** The SQL pieces that sort leads into ready, outside call hours, waiting for retry and scheduled. */
function queueParts(db: AppDatabase, now: Date, settings: Settings, closedZones: string[]) {
  const lastCall = db
    .select({ outcome: calls.outcome, calledAt: calls.calledAt })
    .from(calls)
    .where(eq(calls.leadId, leads.id))
    .orderBy(desc(calls.calledAt))
    .limit(1)
    .as("last_call");
  const retryFrom = new Date(now.getTime() - settings.retryGapHours * 3_600_000);
  const flag = (condition: SQL | undefined) => sql`coalesce(${condition}, false)`;

  const due = flag(lte(leads.nextFollowUpAt, now));
  const scheduled = flag(gt(leads.nextFollowUpAt, now));
  const waiting = sql`(not ${due} and ${flag(and(inArray(lastCall.outcome, RETRY_OUTCOMES), gt(lastCall.calledAt, retryFrom)))})`;
  const outside = closedZones.length > 0 ? flag(inArray(leads.timezone, closedZones)) : sql`false`;
  const ready = sql`(not ${scheduled} and not ${waiting} and not ${outside})`;

  // Due follow-ups (oldest due first), then never called (oldest added first), then oldest last call first.
  const order = [
    sql`case when ${due} then 0 when ${lastCall.calledAt} is null then 1 else 2 end`,
    sql`case when ${due} then ${leads.nextFollowUpAt} when ${lastCall.calledAt} is null then ${leads.createdAt} else ${lastCall.calledAt} end`,
    leads.id,
  ];
  const open = notInArray(leads.status, CLOSED_STATUSES);
  return { lastCall, scheduled, waiting, outside, ready, order, open };
}

type Parts = ReturnType<typeof queueParts>;

async function selectLeads(db: AppDatabase, parts: Parts, where: SQL | undefined, limit: number) {
  const rows = await db
    .select({
      lead: leads,
      listName: lists.name,
      lastOutcome: parts.lastCall.outcome,
      lastCalledAt: parts.lastCall.calledAt,
    })
    .from(leads)
    .leftJoinLateral(parts.lastCall, sql`true`)
    .leftJoin(lists, eq(lists.id, leads.listId))
    .where(where)
    .orderBy(...parts.order)
    .limit(limit);
  return rows.map(({ lead, listName, lastOutcome, lastCalledAt }) => ({
    ...lead,
    listName,
    lastCall: lastOutcome && lastCalledAt ? { outcome: lastOutcome, calledAt: new Date(lastCalledAt) } : null,
    recentCalls: [] as Call[],
  }));
}

/** Adds each lead's three most recent calls. */
async function withRecentCalls(db: AppDatabase, list: QueueLead[]) {
  if (list.length === 0) return;
  const ranked = db
    .select({
      ...getTableColumns(calls),
      n: sql<number>`row_number() over (partition by ${calls.leadId} order by ${calls.calledAt} desc)`.as("n"),
    })
    .from(calls)
    .where(
      inArray(
        calls.leadId,
        list.map((l) => l.id),
      ),
    )
    .as("ranked");
  const rows = await db.select().from(ranked).where(lte(ranked.n, 3)).orderBy(desc(ranked.calledAt));
  for (const lead of list) {
    lead.recentCalls = rows
      .filter((row) => row.leadId === lead.id)
      .map((row): Call => ({
        id: row.id,
        leadId: row.leadId,
        outcome: row.outcome,
        note: row.note,
        calledAt: new Date(row.calledAt),
        followUpAt: row.followUpAt && new Date(row.followUpAt),
        channel: row.channel,
        durationSec: row.durationSec,
        externalId: row.externalId,
      }));
  }
}

export async function getQueue(db: AppDatabase, options: QueueOptions): Promise<Queue> {
  const { now, settings, limit = 30 } = options;
  const listId = options.listId && isUuid(options.listId) ? options.listId : null;
  const window = callWindowOf(settings);
  const closedZones = await zonesNow(db, now, window);
  const parts = queueParts(db, now, settings, closedZones);
  const scope = and(parts.open, listId ? eq(leads.listId, listId) : undefined);

  const [[counts], ready, pinnedRows] = await Promise.all([
    db
      .select({
        ready: sql<number>`count(*) filter (where ${parts.ready})`.mapWith(Number),
        outside:
          sql<number>`count(*) filter (where not ${parts.scheduled} and not ${parts.waiting} and ${parts.outside})`.mapWith(
            Number,
          ),
        waiting: sql<number>`count(*) filter (where not ${parts.scheduled} and ${parts.waiting})`.mapWith(Number),
        scheduled: sql<number>`count(*) filter (where ${parts.scheduled})`.mapWith(Number),
      })
      .from(leads)
      .leftJoinLateral(parts.lastCall, sql`true`)
      .where(scope),
    selectLeads(db, parts, and(scope, parts.ready), limit),
    options.pinnedId && isUuid(options.pinnedId)
      ? selectLeads(db, parts, eq(leads.id, options.pinnedId), 1)
      : Promise.resolve([] as QueueLead[]),
  ]);

  const pinnedLead = pinnedRows[0] ?? null;
  const pinnedProblem = !options.pinnedId
    ? null
    : !pinnedLead
      ? "not_found"
      : pinnedLead.status === "do_not_call"
        ? "do_not_call"
        : null;
  const pinned = pinnedProblem ? null : pinnedLead;
  await withRecentCalls(db, pinned ? [...ready, pinned] : ready);

  let nextOpen: Queue["nextOpen"] = null;
  if (counts.ready === 0 && counts.outside > 0) {
    const openings = closedZones
      .map((zone) => ({ zone, at: nextWindowOpen(zone, now, window) }))
      .filter((o): o is { zone: string; at: Date } => o.at !== null)
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    for (const { zone, at } of openings) {
      const [lead] = await selectLeads(
        db,
        parts,
        and(scope, sql`not ${parts.scheduled} and not ${parts.waiting}`, eq(leads.timezone, zone)),
        1,
      );
      if (lead) {
        nextOpen = { leadId: lead.id, name: lead.name, timezone: zone, at };
        break;
      }
    }
  }

  return { ready, counts, pinned, pinnedProblem, nextOpen };
}

/** How many leads in each list can be called now, for the lists page. Lists with none are left out. */
export async function readyCountsByList(
  db: AppDatabase,
  { now, settings }: { now: Date; settings: Settings },
): Promise<Record<string, number>> {
  const closedZones = await zonesNow(db, now, callWindowOf(settings));
  const parts = queueParts(db, now, settings, closedZones);
  const rows = await db
    .select({ listId: leads.listId, ready: count() })
    .from(leads)
    .leftJoinLateral(parts.lastCall, sql`true`)
    .where(and(parts.open, isNotNull(leads.listId), parts.ready))
    .groupBy(leads.listId);
  return Object.fromEntries(rows.map((r) => [r.listId, r.ready]));
}
