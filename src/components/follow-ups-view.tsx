"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Chip, StatusChip } from "@/components/chips";
import { LeadLocalTime, useNow } from "@/components/times";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CallWindow } from "@/lib/call-window";
import type { FollowUpItem } from "@/lib/data/follow-ups";
import { dayBoundaries, groupFollowUps } from "@/lib/follow-ups";
import { duration } from "@/lib/format";
import { queueHref } from "@/lib/queue";

const timeOnly = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayAndTime = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });

/** Overdue, due today and next 7 days, grouped on your own clock (so this renders in the browser). */
export function FollowUpsView({
  items,
  total,
  callWindow,
}: {
  items: FollowUpItem[];
  total: number;
  callWindow: CallWindow;
}) {
  const now = useNow();
  if (!now) return <Skeleton aria-busy="true" aria-label="Loading follow-ups" className="h-64 max-w-250 rounded-lg" />;

  const groups = groupFollowUps(items, { now, ...dayBoundaries(now) });
  const sections: [string, string, FollowUpItem[], string][] = [
    ["overdue", "Overdue", groups.overdue, "Nothing overdue."],
    ["today", "Due today", groups.today, "Nothing else due today."],
    ["week", "Next 7 days", groups.week, "Nothing scheduled this week."],
  ];
  const when = (item: FollowUpItem, group: string) =>
    group === "overdue"
      ? `${duration(now.getTime() - item.at.getTime())} overdue`
      : (group === "today" ? timeOnly : dayAndTime).format(item.at);

  return (
    <div className="max-w-250">
      {sections.map(([key, title, rows, empty]) => (
        <section key={key} aria-labelledby={`follow-ups-${key}`} className="mb-5">
          <h2
            id={`follow-ups-${key}`}
            className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase"
          >
            {title} · {rows.length}
          </h2>
          {rows.length === 0 ? (
            <p className="rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">{empty}</p>
          ) : (
            <div className="relative overflow-x-auto rounded-lg border bg-card">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="[&>th]:h-8.5 [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground">
                    <th>When</th>
                    <th>Lead</th>
                    <th>Type</th>
                    <th className="max-md:hidden">Last note</th>
                    <th>Their time</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={item.id}
                      className="[&>td]:h-11 [&>td]:border-b [&>td]:px-3 [&>td]:py-1 [&>td]:whitespace-nowrap last:[&>td]:border-b-0"
                    >
                      <td className={key === "overdue" ? "font-mono font-medium text-danger" : "font-mono"}>
                        {when(item, key)}
                      </td>
                      <td>
                        <Link href={`/leads/${item.id}`} className="block text-inherit no-underline">
                          <strong className="block font-medium">{item.name}</strong>
                          {item.company && <span className="text-xs text-muted-foreground">{item.company}</span>}
                        </Link>
                      </td>
                      <td>
                        {item.status === "meeting_booked" ? (
                          <Chip tone="accent">Meeting</Chip>
                        ) : (
                          <StatusChip status={item.status} />
                        )}
                      </td>
                      <td className="max-w-80 text-xs whitespace-normal! text-muted-foreground max-md:hidden">
                        {item.lastNote}
                      </td>
                      <td>
                        <LeadLocalTime zone={item.timezone} window={callWindow} />
                      </td>
                      <td className="text-right">
                        {item.status === "meeting_booked" ? (
                          <Button variant="ghost" asChild>
                            <Link href={`/leads/${item.id}`}>Open</Link>
                          </Button>
                        ) : (
                          <Button variant="outline" asChild>
                            <Link href={queueHref(null, item.id)}>
                              <Phone aria-hidden="true" />
                              Call now
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      {total > items.length && (
        <p className="text-xs text-muted-foreground">
          Showing the first {items.length} of {total} follow-ups. Work through the overdue ones to see the rest.
        </p>
      )}
    </div>
  );
}
