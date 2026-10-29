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

export type LocalDate = { year: number; month: number; day: number };

const calendars = new Map<string, Intl.DateTimeFormat>();

function wallClock(zone: string, at: Date) {
  let calendar = calendars.get(zone);
  if (!calendar) {
    calendar = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    calendars.set(zone, calendar);
  }
  const parts = Object.fromEntries(calendar.formatToParts(at).map((p) => [p.type, Number(p.value)]));
  return parts as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** The calendar date at `at` in `zone`. */
export function localDate(zone: string, at: Date): LocalDate {
  const { year, month, day } = wallClock(zone, at);
  return { year, month, day };
}

/** How far `zone`'s clock is ahead of UTC at `at`, in milliseconds. */
function offsetAt(zone: string, at: number): number {
  const p = wallClock(zone, new Date(at));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (at - (at % 1000));
}

/** The instant when `zone`'s clock shows `minutes` after midnight on `date`. Days past month end roll over. */
export function zonedTime(zone: string, date: LocalDate, minutes: number): Date {
  const wall = Date.UTC(date.year, date.month - 1, date.day, 0, minutes);
  // Guess with the offset at the wall time, then correct with the offset at the guess (handles DST changes).
  const guess = wall - offsetAt(zone, wall);
  return new Date(wall - offsetAt(zone, guess));
}

/** When the lead's call hours next open: `from` itself if they're open now, null if no day is a call day. */
export function nextWindowOpen(zone: string, from: Date, window: CallWindow): Date | null {
  if (isInCallWindow(zone, from, window)) return from;
  const today = localDate(zone, from);
  const start = parseClock(window.start);
  for (let i = 0; i <= 7; i++) {
    const at = zonedTime(zone, { ...today, day: today.day + i }, start);
    if (at > from && isInCallWindow(zone, at, window)) return at;
  }
  return null;
}
