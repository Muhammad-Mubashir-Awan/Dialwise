import { describe, expect, it } from "vitest";
import { isInCallWindow, localClock, parseClock } from "@/lib/call-window";

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
