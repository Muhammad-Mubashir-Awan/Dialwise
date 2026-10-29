import { describe, expect, it } from "vitest";
import { dayBoundaries, dueToday, groupFollowUps } from "@/lib/follow-ups";

const NOW = new Date("2026-10-29T12:00:00Z");
const END_OF_TODAY = new Date("2026-10-30T00:00:00Z");
const END_OF_WEEK = new Date("2026-11-06T00:00:00Z");
const at = (iso: string) => ({ id: iso, at: new Date(iso) });

describe("groupFollowUps", () => {
  it("splits follow-ups into overdue, due today and the next 7 days", () => {
    const items = [
      at("2026-10-27T09:00:00Z"),
      at("2026-10-29T11:59:00Z"),
      at("2026-10-29T12:00:00Z"),
      at("2026-10-29T23:59:00Z"),
      at("2026-10-30T00:00:00Z"),
      at("2026-11-05T23:59:00Z"),
      at("2026-11-06T00:00:00Z"),
    ];
    const groups = groupFollowUps(items, { now: NOW, endOfToday: END_OF_TODAY, endOfWeek: END_OF_WEEK });
    expect(groups.overdue.map((i) => i.id)).toEqual(["2026-10-27T09:00:00Z", "2026-10-29T11:59:00Z"]);
    expect(groups.today.map((i) => i.id)).toEqual(["2026-10-29T12:00:00Z", "2026-10-29T23:59:00Z"]);
    expect(groups.week.map((i) => i.id)).toEqual(["2026-10-30T00:00:00Z", "2026-11-05T23:59:00Z"]);
  });
});

describe("dueToday", () => {
  it("counts what's due by the end of today and how much of it is overdue", () => {
    const times = ["2026-10-28T09:00:00Z", "2026-10-29T15:00:00Z", "2026-10-30T09:00:00Z"].map((t) => new Date(t));
    expect(dueToday(times, { now: NOW, endOfToday: END_OF_TODAY })).toEqual({ due: 2, overdue: 1 });
  });
});

describe("dayBoundaries", () => {
  it("gives local midnight at the end of today and 7 days after it", () => {
    expect(dayBoundaries(new Date(2026, 9, 29, 15, 30))).toEqual({
      endOfToday: new Date(2026, 9, 30),
      endOfWeek: new Date(2026, 10, 6),
    });
  });
});
