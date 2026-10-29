/** Follow-ups and booked meetings: leads with a next follow-up time, except those that are closed for good. */
import { and, asc, count, desc, eq, isNotNull, lt, notInArray, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { calls, type Lead, leads } from "@/lib/db/schema";
import { NO_FOLLOW_UP_STATUSES } from "@/lib/outcomes";

export type FollowUpItem = Pick<Lead, "id" | "name" | "company" | "status" | "timezone"> & {
  at: Date;
  /** The note from the lead's latest call, often the one that set this follow-up. */
  lastNote: string | null;
};

const pending = (until: Date) =>
  and(
    isNotNull(leads.nextFollowUpAt),
    lt(leads.nextFollowUpAt, until),
    notInArray(leads.status, NO_FOLLOW_UP_STATUSES),
  );

/** Follow-ups due before `until`, soonest first (overdue ones come first), with the total. */
export async function listFollowUps(
  db: AppDatabase,
  { until, limit = 500 }: { until: Date; limit?: number },
): Promise<{ items: FollowUpItem[]; total: number }> {
  const lastCall = db
    .select({ note: calls.note })
    .from(calls)
    .where(eq(calls.leadId, leads.id))
    .orderBy(desc(calls.calledAt))
    .limit(1)
    .as("last_call");
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        company: leads.company,
        status: leads.status,
        timezone: leads.timezone,
        at: leads.nextFollowUpAt,
        lastNote: lastCall.note,
      })
      .from(leads)
      .leftJoinLateral(lastCall, sql`true`)
      .where(pending(until))
      .orderBy(asc(leads.nextFollowUpAt), asc(leads.id))
      .limit(limit),
    db.select({ total: count() }).from(leads).where(pending(until)),
  ]);
  return {
    items: rows.map((row) => ({ ...row, at: row.at!, lastNote: row.lastNote || null })),
    total,
  };
}

/** Just the times of follow-ups due before `until`, for the sidebar's "due today" count. */
export async function followUpTimes(db: AppDatabase, { until }: { until: Date }): Promise<Date[]> {
  const rows = await db
    .select({ at: leads.nextFollowUpAt })
    .from(leads)
    .where(pending(until))
    .orderBy(asc(leads.nextFollowUpAt));
  return rows.map((row) => row.at!);
}
