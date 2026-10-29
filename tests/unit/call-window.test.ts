import { describe, expect, it } from "vitest";
import { isInCallWindow, localClock, localDate, nextWindowOpen, parseClock, zonedTime } from "@/lib/call-window";

const WINDOW = { start: "09:00:00", end: "18:00:00", days: [1, 2, 3, 4, 5] };
// Thursday 29 October 2026, 12:00 UTC (London is on GMT, New York on EDT until 1 November).
const THU_NOON_UTC = new Date("2026-10-29T12:00:00Z");

describe("parseClock", () => {
  it("reads HH:MM and HH:MM:SS as minutes after midnight", () => {
    expect(parseClock("09:00")).toBe(540);
    expect(parseClock("18:30:00")).toBe(1110);
  });
});

describe("localClock", () => {
  it("gives the weekday and minutes in the lead's time zone", () => {
    expect(localClock("Europe/London", THU_NOON_UTC)).toEqual({ weekday: 4, minutes: 12 * 60 });
    expect(localClock("America/New_York", THU_NOON_UTC)).toEqual({ weekday: 4, minutes: 8 * 60 });
    expect(localClock("Asia/Karachi", THU_NOON_UTC)).toEqual({ weekday: 4, minutes: 17 * 60 });
  });

  it("rolls over to the lead's next day", () => {
    // 14:00 UTC on Thursday is 01:00 on Friday in Sydney (AEDT, UTC+11).
    expect(localClock("Australia/Sydney", new Date("2026-10-29T14:00:00Z"))).toEqual({ weekday: 5, minutes: 60 });
  });
});

describe("isInCallWindow", () => {
  it("is open during the lead's working hours", () => {
    expect(isInCallWindow("Europe/London", THU_NOON_UTC, WINDOW)).toBe(true);
    expect(isInCallWindow("Asia/Karachi", THU_NOON_UTC, WINDOW)).toBe(true);
  });

  it("is closed before the start and from the end time on", () => {
    expect(isInCallWindow("America/New_York", THU_NOON_UTC, WINDOW)).toBe(false);
    expect(isInCallWindow("Europe/London", new Date("2026-10-29T18:00:00Z"), WINDOW)).toBe(false);
    expect(isInCallWindow("Europe/London", new Date("2026-10-29T17:59:00Z"), WINDOW)).toBe(true);
  });

  it("is closed on days that aren't call days in the lead's time zone", () => {
    expect(isInCallWindow("Europe/London", new Date("2026-10-31T12:00:00Z"), WINDOW)).toBe(false);
    // Thursday 23:00 in Sydney: a call day, but outside hours.
    expect(isInCallWindow("Australia/Sydney", THU_NOON_UTC, WINDOW)).toBe(false);
  });

  it("is always open when the lead's time zone is unknown", () => {
    expect(isInCallWindow(null, new Date("2026-10-31T03:00:00Z"), WINDOW)).toBe(true);
  });
});

describe("zonedTime", () => {
  it("turns a wall-clock time in a zone into the instant", () => {
    expect(zonedTime("Europe/London", { year: 2026, month: 10, day: 30 }, 10 * 60)).toEqual(
      new Date("2026-10-30T10:00:00Z"),
    );
    // New York is on EDT (UTC-4) until 1 November, then EST (UTC-5).
    expect(zonedTime("America/New_York", { year: 2026, month: 10, day: 30 }, 10 * 60)).toEqual(
      new Date("2026-10-30T14:00:00Z"),
    );
    expect(zonedTime("America/New_York", { year: 2026, month: 11, day: 2 }, 10 * 60)).toEqual(
      new Date("2026-11-02T15:00:00Z"),
    );
  });

  it("rolls day overflow into the next month", () => {
    expect(zonedTime("Asia/Karachi", { year: 2026, month: 10, day: 32 }, 9 * 60)).toEqual(
      new Date("2026-11-01T04:00:00Z"),
    );
  });
});

describe("localDate", () => {
  it("gives the calendar date in the zone", () => {
    expect(localDate("Australia/Sydney", new Date("2026-10-29T14:00:00Z"))).toEqual({ year: 2026, month: 10, day: 30 });
    expect(localDate("America/New_York", new Date("2026-10-29T02:00:00Z"))).toEqual({ year: 2026, month: 10, day: 28 });
  });
});

describe("nextWindowOpen", () => {
  it("is now when the lead is already in call hours", () => {
    expect(nextWindowOpen("Europe/London", THU_NOON_UTC, WINDOW)).toEqual(THU_NOON_UTC);
  });

  it("is the start of hours later today in the lead's zone", () => {
    expect(nextWindowOpen("America/New_York", THU_NOON_UTC, WINDOW)).toEqual(new Date("2026-10-29T13:00:00Z"));
  });

  it("is tomorrow morning when today's hours are over", () => {
    // Thursday 23:00 in Sydney: opens Friday 09:00 AEDT.
    expect(nextWindowOpen("Australia/Sydney", THU_NOON_UTC, WINDOW)).toEqual(new Date("2026-10-29T22:00:00Z"));
  });

  it("skips days that aren't call days", () => {
    // Saturday in London: opens Monday 09:00 GMT.
    expect(nextWindowOpen("Europe/London", new Date("2026-10-31T12:00:00Z"), WINDOW)).toEqual(
      new Date("2026-11-02T09:00:00Z"),
    );
  });

  it("is never when no day is a call day", () => {
    expect(nextWindowOpen("Europe/London", THU_NOON_UTC, { ...WINDOW, days: [] })).toBeNull();
  });
});
