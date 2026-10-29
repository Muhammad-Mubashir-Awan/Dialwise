"use client";

import { cn } from "cn";
import { useNow } from "@/components/times";
import { dayBoundaries, dueToday } from "@/lib/follow-ups";

const countClass = "ml-auto font-mono text-xs text-subtle-foreground";

export function NavCount({ n }: { n: number }) {
  return <span className={countClass}>{n}</span>;
}

/** Follow-ups due by the end of your today; red when some are overdue. */
export function DueCount({ times }: { times: Date[] }) {
  const now = useNow();
  if (!now) return null;
  const { due, overdue } = dueToday(times, { now, endOfToday: dayBoundaries(now).endOfToday });
  return (
    <span className={cn(countClass, overdue > 0 && "font-medium text-danger")}>
      {due}
      {overdue > 0 && <span className="sr-only">, {overdue} overdue</span>}
    </span>
  );
}
