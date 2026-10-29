/** Whether it's a good time to call a lead, judged on the lead's own clock. Pure; shared by the leads table and the queue. */

export type CallWindow = {
  /** "09:00" or "09:00:00" (Postgres `time`). */
  start: string;
  end: string;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const clocks = new Map<string, Intl.DateTimeFormat>();

/** "09:30" → 570 minutes after midnight. */
export function parseClock(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** The weekday (0 = Sunday) and minutes after midnight at `at` in `zone`. */
export function localClock(zone: string, at: Date): { weekday: number; minutes: number } {
  let clock = clocks.get(zone);
  if (!clock) {
    clock = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    clocks.set(zone, clock);
  }
  const parts = Object.fromEntries(clock.formatToParts(at).map((p) => [p.type, p.value]));
  return { weekday: WEEKDAYS.indexOf(parts.weekday), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** True on a call day between start (inclusive) and end (exclusive), lead's time. A lead with no known zone is always callable. */
export function isInCallWindow(zone: string | null, at: Date, window: CallWindow): boolean {
  if (!zone) return true;
  const { weekday, minutes } = localClock(zone, at);
  return window.days.includes(weekday) && minutes >= parseClock(window.start) && minutes < parseClock(window.end);
}
