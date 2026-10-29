/** Queue helpers that run in the browser: order after skips, why a lead is up, and follow-up times. Pure. */
import { localClock, localDate, zonedTime } from "@/lib/call-window";
import type { CallOutcome } from "@/lib/db/schema";
import { relativeTime } from "@/lib/format";
import { OUTCOME_META } from "@/lib/outcomes";

const HOUR = 3_600_000;

/**
 * The order to work through: a lead picked with "Call now" first, then the server's order, with skipped leads
 * moved to the back (in the order they were skipped). Leads just logged are left out until the server catches up.
 */
export function arrangeQueue<T extends { id: string }>(
  ready: T[],
  { pinned, skipped = [], hidden = [] }: { pinned?: T | null; skipped?: string[]; hidden?: string[] },
): T[] {
  const gone = new Set(hidden);
  const skippedSet = new Set(skipped);
  const front = pinned && !gone.has(pinned.id) ? [pinned] : [];
  const rest = ready.filter((lead) => !gone.has(lead.id) && lead.id !== pinned?.id);
  const back = skipped.flatMap((id) => rest.filter((lead) => lead.id === id));
  return [...front, ...rest.filter((lead) => !skippedSet.has(lead.id)), ...back];
}

type ReasonLead = { nextFollowUpAt: Date | null; lastCall: { outcome: CallOutcome; calledAt: Date } | null };

/** Why this lead is up: a due follow-up, a first call, or the last call. */
export function queueReason(lead: ReasonLead, now: Date): { text: string; due: boolean } {
  if (lead.nextFollowUpAt && lead.nextFollowUpAt <= now) {
    return { text: `Follow-up due ${relativeTime(lead.nextFollowUpAt, now)}`, due: true };
  }
  if (!lead.lastCall) return { text: "First call", due: false };
  const { outcome, calledAt } = lead.lastCall;
  return { text: `Last call ${relativeTime(calledAt, now)} · ${OUTCOME_META[outcome].label}`, due: false };
}

export type FollowUpChoice = { id: "2h" | "tomorrow" | "monday" | "week"; label: string; at: Date };

/** Quick follow-up times. "Tomorrow" and "Monday" are 10:00 on the lead's clock (`zone`). */
export function followUpChoices(zone: string, now: Date): FollowUpChoice[] {
  const today = localDate(zone, now);
  const daysToMonday = (8 - localClock(zone, now).weekday) % 7 || 7;
  return [
    { id: "2h", label: "In 2 hours", at: new Date(now.getTime() + 2 * HOUR) },
    { id: "tomorrow", label: "Tomorrow 10:00", at: zonedTime(zone, { ...today, day: today.day + 1 }, 10 * 60) },
    { id: "monday", label: "Monday 10:00", at: zonedTime(zone, { ...today, day: today.day + daysToMonday }, 10 * 60) },
    { id: "week", label: "In 1 week", at: new Date(now.getTime() + 7 * 24 * HOUR) },
  ];
}

/** A link to the queue, optionally scoped to a list and with a picked lead first. */
export function queueHref(listId: string | null, leadId?: string): string {
  const params = new URLSearchParams();
  if (listId) params.set("list", listId);
  if (leadId) params.set("lead", leadId);
  const query = params.toString();
  return query ? `/queue?${query}` : "/queue";
}
