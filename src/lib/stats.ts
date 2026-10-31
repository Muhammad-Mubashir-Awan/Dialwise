/**
 * Call statistics for a period, on the browser's own calendar. Pure: the server sends the recent calls and the
 * browser decides where "today" starts, since only the browser knows its time zone.
 */
import { CALL_OUTCOMES, type CallOutcome } from "@/lib/db/schema";
import { CONVERSATION_OUTCOMES, WON_STATUSES } from "@/lib/outcomes";

/** One logged call. `list` is the index into the `lists` names, or -1 when the lead has no list. */
export type StatsCall = { at: number; outcome: CallOutcome; list: number };

export type Totals = { calls: number; conversations: number; rate: number; won: number; meetings: number };
export type DayPoint = { day: number; calls: number; conversations: number };
export type ListRow = Totals & { name: string };

export type Stats = {
  totals: Totals;
  /** The same length of time just before this period, for the comparison. */
  previous: Totals;
  /** One point per day, oldest first, today last. */
  series: DayPoint[];
  outcomes: { outcome: CallOutcome; count: number }[];
  byList: ListRow[];
};

const NO_LIST = "No list";
const DAY = 86_400_000;

const isConversation = (outcome: CallOutcome) => CONVERSATION_OUTCOMES.includes(outcome);
// "Interested or booked" counts calls, so it uses the outcomes that give a lead those two statuses.
const isWin = (outcome: CallOutcome) => (WON_STATUSES as string[]).includes(outcome);

/** Midnight at the start of the first day of a period of `days` days that ends today. */
export function periodStart(now: Date, days: number): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)).getTime();
}

function emptyTotals(): Totals {
  return { calls: 0, conversations: 0, rate: 0, won: 0, meetings: 0 };
}

function add(totals: Totals, outcome: CallOutcome) {
  totals.calls += 1;
  if (isConversation(outcome)) totals.conversations += 1;
  if (isWin(outcome)) totals.won += 1;
  if (outcome === "meeting_booked") totals.meetings += 1;
}

function finish(totals: Totals): Totals {
  totals.rate = totals.calls ? totals.conversations / totals.calls : 0;
  return totals;
}

/** Whole calendar days from one local date to another, which stays right across clock changes. */
const daysBetween = (from: Date, to: Date) =>
  Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      DAY,
  );

export function summarize(
  calls: StatsCall[],
  { now, days, lists }: { now: Date; days: number; lists: string[] },
): Stats {
  const start = periodStart(now, days);
  const previousStart = periodStart(new Date(start), days + 1);
  const startDate = new Date(start);

  const totals = emptyTotals();
  const previous = emptyTotals();
  const counts = Object.fromEntries(CALL_OUTCOMES.map((o) => [o, 0])) as Record<CallOutcome, number>;
  const series: DayPoint[] = Array.from({ length: days }, (_, i) => ({
    day: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i).getTime(),
    calls: 0,
    conversations: 0,
  }));
  const rows = new Map<number, Totals>();

  for (const call of calls) {
    if (call.at >= previousStart && call.at < start) {
      add(previous, call.outcome);
      continue;
    }
    if (call.at < start || call.at > now.getTime()) continue;

    add(totals, call.outcome);
    counts[call.outcome] += 1;
    const point = series[daysBetween(startDate, new Date(call.at))];
    point.calls += 1;
    if (isConversation(call.outcome)) point.conversations += 1;
    add(rows.get(call.list) ?? rows.set(call.list, emptyTotals()).get(call.list)!, call.outcome);
  }

  // The lists in their given order, then "No list" last, so busiest-first ties keep a steady order.
  const byList = [...lists, NO_LIST]
    .map((name, i) => ({ name, row: rows.get(i === lists.length ? -1 : i) }))
    .flatMap(({ name, row }) => (row ? [{ name, ...finish(row) }] : []))
    .sort((a, b) => b.calls - a.calls);

  return {
    totals: finish(totals),
    previous: finish(previous),
    series,
    outcomes: CALL_OUTCOMES.map((outcome) => ({ outcome, count: counts[outcome] })),
    byList,
  };
}

/** How `current` compares with `previous`, or null when there's nothing earlier to compare with. */
export function change(
  current: number,
  previous: number,
): { percent: number; direction: "up" | "down" | "flat" } | null {
  if (!previous) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  return { percent, direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat" };
}

const SCALE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

/** A round top and gridline step for a chart whose tallest bar is `max`, with at most five gaps. */
export function niceScale(max: number): { top: number; step: number } {
  const step = SCALE_STEPS.find((s) => Math.ceil(max / s) <= 5) ?? Math.ceil(max / 5);
  return { top: Math.ceil(max / step) * step, step };
}
