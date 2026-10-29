"use client";

import { useSyncExternalStore } from "react";
import { cn } from "cn";
import { Chip } from "@/components/chips";
import { type CallWindow, isInCallWindow } from "@/lib/call-window";
import { relativeTime } from "@/lib/format";
import { timeZoneLabel } from "@/lib/timezones";

// One shared clock for every time on the page, ticking every 30 seconds.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * The current time, or null while rendering on the server. Times are shown in the browser's own time zone,
 * which the server doesn't know, so they appear right after the page loads.
 */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
  return ms === null ? null : new Date(ms);
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "29 Oct, 14:05" in your time zone. */
export function DateTime({ at, dateOnly: onlyDate = false }: { at: Date; dateOnly?: boolean }) {
  const ready = useNow() !== null;
  return <time dateTime={at.toISOString()}>{ready ? (onlyDate ? dateOnly : dateTime).format(at) : ""}</time>;
}

/** "2h ago", "in 3 days". */
export function RelativeTime({ at, className }: { at: Date; className?: string }) {
  const current = useNow();
  return (
    <time dateTime={at.toISOString()} title={current ? dateTime.format(at) : undefined} className={className}>
      {current ? relativeTime(at, current) : ""}
    </time>
  );
}

/** The follow-up time, in red once it's overdue. */
export function FollowUpTime({ at }: { at: Date | null }) {
  const current = useNow();
  if (!at) return <span className="text-muted-foreground">—</span>;
  const overdue = current !== null && at < current;
  return <RelativeTime at={at} className={cn(overdue ? "font-medium text-danger" : "text-muted-foreground")} />;
}

/** The lead's local time with a dot: green in call hours, amber outside them. */
export function LeadLocalTime({
  zone,
  window,
  showCity = true,
}: {
  zone: string | null;
  window: CallWindow;
  showCity?: boolean;
}) {
  const current = useNow();
  if (!zone) return <span className="text-subtle-foreground">Unknown</span>;
  if (!current) return <span className="inline-block h-4 w-20" />;
  const open = isInCallWindow(zone, current, window);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-1.75 shrink-0 rounded-full", open ? "bg-ok" : "bg-warn")} />
      <span className="font-mono tabular-nums">{time.format(current)}</span>
      {showCity && <span className="text-muted-foreground max-md:hidden">{timeZoneLabel(zone)}</span>}
      <span className="sr-only">{open ? "in call hours" : "outside call hours"}</span>
    </span>
  );
}

/** "In call hours" / "Outside call hours" / "Time zone unknown". */
export function CallWindowChip({ zone, window }: { zone: string | null; window: CallWindow }) {
  const current = useNow();
  if (!zone) return <Chip tone="neutral">Time zone unknown</Chip>;
  if (!current) return null;
  return isInCallWindow(zone, current, window) ? (
    <Chip tone="ok">In call hours</Chip>
  ) : (
    <Chip tone="warn">Outside call hours</Chip>
  );
}
