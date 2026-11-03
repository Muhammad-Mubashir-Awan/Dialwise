"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CallsChart } from "@/components/stats/calls-chart";
import { useNow } from "@/components/times";
import { Skeleton } from "@/components/ui/skeleton";
import { OUTCOME_META } from "@/lib/outcomes";
import { change, changeText, type Stats, type StatsCall, summarize } from "@/lib/stats";

const PERIODS = [7, 30] as const;

const percent = (rate: number) => `${(rate * 100).toFixed(1)}%`;

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-lg border bg-card">
      <h2 id={id} className="border-b px-4 py-3 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  delta,
  earlierCalls,
  days,
}: {
  label: string;
  value: string;
  delta: ReturnType<typeof change>;
  earlierCalls: number;
  days: number;
}) {
  const tone =
    delta?.direction === "up" ? "text-ok" : delta?.direction === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-3.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className={`font-mono text-xs ${tone}`}>{changeText(delta, earlierCalls, days)}</span>
    </div>
  );
}

function Outcomes({ outcomes }: { outcomes: Stats["outcomes"] }) {
  const max = Math.max(...outcomes.map((o) => o.count), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-4">
      {outcomes.map(({ outcome, count }) => (
        <li key={outcome} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.75rem] items-center gap-2.5 text-sm">
          <span>{OUTCOME_META[outcome].label}</span>
          <span aria-hidden="true" className="h-2 overflow-hidden rounded bg-muted">
            <span className="block h-full rounded bg-chart-1" style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function ByList({ rows }: { rows: Stats["byList"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="[&>th]:h-8.5 [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground [&>th.num]:text-right">
            <th>List</th>
            <th className="num">Calls</th>
            <th className="num">Conversation rate</th>
            <th className="num">Interested or booked</th>
            <th className="num">Meetings</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr>td]:h-10 [&>tr>td]:border-b [&>tr>td]:px-3 [&>tr>td.num]:text-right [&>tr>td.num]:font-mono [&>tr>td.num]:tabular-nums">
          {/* By position, because a list can itself be called "No list". */}
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="font-medium">{row.name}</td>
              <td className="num">{row.calls}</td>
              <td className="num">{percent(row.rate)}</td>
              <td className="num">{row.won}</td>
              <td className="num">{row.meetings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Calls, conversations and results for the last 7 or 30 days, worked out on your own clock in the browser. */
export function StatsView({ calls, lists }: { calls: StatsCall[]; lists: string[] }) {
  const now = useNow();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  // Only the date matters, so this recalculates when the day changes, not on every tick of the shared clock.
  const today = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : null;
  const stats = useMemo(
    () => (today === null ? null : summarize(calls, { now: new Date(today), days, lists })),
    [calls, lists, days, today],
  );

  const { totals, previous } = stats ?? {};

  return (
    <div className="flex max-w-285 flex-col gap-3">
      <div
        role="group"
        aria-label="Period"
        className="inline-flex w-fit overflow-hidden rounded-md border border-input"
      >
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={days === p}
            onClick={() => setDays(p)}
            className="h-8 cursor-pointer bg-card px-3 text-[13px] text-muted-foreground outline-none not-first:border-l not-first:border-input focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:font-medium aria-pressed:text-accent-foreground"
          >
            Last {p} days
          </button>
        ))}
      </div>

      {!stats || !totals || !previous ? (
        <Skeleton aria-busy="true" aria-label="Loading stats" className="h-80 rounded-lg" />
      ) : totals.calls === 0 ? (
        <div className="max-w-250 rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
          <strong className="mb-1 block text-base font-medium text-foreground">No calls in the last {days} days</strong>
          Calls you log in the{" "}
          <Link href="/queue" className="text-primary hover:underline">
            Queue
          </Link>{" "}
          show up here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile
              label="Calls"
              value={totals.calls.toLocaleString("en-GB")}
              delta={change(totals.calls, previous.calls)}
              earlierCalls={previous.calls}
              days={days}
            />
            <Tile
              label="Conversation rate"
              value={percent(totals.rate)}
              delta={change(totals.rate, previous.rate)}
              earlierCalls={previous.calls}
              days={days}
            />
            <Tile
              label="Interested or booked"
              value={String(totals.won)}
              delta={change(totals.won, previous.won)}
              earlierCalls={previous.calls}
              days={days}
            />
            <Tile
              label="Meetings booked"
              value={String(totals.meetings)}
              delta={change(totals.meetings, previous.meetings)}
              earlierCalls={previous.calls}
              days={days}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <CallsChart series={stats.series} />
            <Panel id="stats-outcomes-title" title="Outcomes">
              <Outcomes outcomes={stats.outcomes} />
            </Panel>
          </div>
          <Panel id="stats-lists-title" title="By list">
            <ByList rows={stats.byList} />
          </Panel>
          <p className="text-xs text-muted-foreground">
            A conversation means you reached someone who could decide: callback, interested, meeting booked, not
            interested or do not call. Days follow your own clock.
          </p>
        </>
      )}
    </div>
  );
}
