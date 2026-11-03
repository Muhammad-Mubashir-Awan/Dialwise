import { describe, expect, it } from "vitest";
import type { CallOutcome } from "@/lib/db/schema";
import { change, changeText, niceScale, periodStart, type StatsCall, summarize } from "@/lib/stats";

// A Tuesday afternoon, on whatever clock the test machine keeps.
const NOW = new Date(2026, 9, 20, 14, 30);
const day = (back: number, hour = 12) => new Date(2026, 9, 20 - back, hour).getTime();

const call = (at: number, outcome: CallOutcome = "no_answer", list = -1): StatsCall => ({ at, outcome, list });

const summary = (calls: StatsCall[], days = 7, lists: string[] = []) => summarize(calls, { now: NOW, days, lists });

describe("periodStart", () => {
  it("starts at local midnight so the period covers whole days", () => {
    expect(periodStart(NOW, 7)).toEqual(new Date(2026, 9, 14).getTime());
    expect(periodStart(NOW, 30)).toEqual(new Date(2026, 8, 21).getTime());
  });
});

describe("summarize totals", () => {
  it("counts calls, conversations, wins and meetings in the period", () => {
    const stats = summary([
      call(day(0), "no_answer"),
      call(day(1), "interested"),
      call(day(2), "meeting_booked"),
      call(day(3), "not_interested"),
      call(day(4), "voicemail"),
    ]);
    expect(stats.totals).toEqual({ calls: 5, conversations: 3, rate: 0.6, won: 2, meetings: 1 });
  });

  it("is all zeros with no calls, and the rate doesn't divide by zero", () => {
    expect(summary([]).totals).toEqual({ calls: 0, conversations: 0, rate: 0, won: 0, meetings: 0 });
  });

  it("leaves out calls before the period and after today", () => {
    const stats = summary([call(day(7)), call(day(30)), call(day(-1)), call(day(0))]);
    expect(stats.totals.calls).toBe(1);
  });

  it("counts the period before this one separately", () => {
    const stats = summary([call(day(0)), call(day(8), "interested"), call(day(13)), call(day(14))]);
    expect(stats.totals.calls).toBe(1);
    expect(stats.previous).toMatchObject({ calls: 2, conversations: 1, won: 1 });
  });
});

describe("a call newer than the page's clock", () => {
  it("still counts: the clock on the page can lag a call that was only just logged", () => {
    const justLogged = NOW.getTime() + 20_000;
    const stats = summary([call(justLogged, "interested", 0)], 7, ["Dentists"]);
    expect(stats.totals.calls).toBe(1);
    expect(stats.series.at(-1)?.calls).toBe(1);
    expect(stats.byList[0].calls).toBe(1);
  });
});

describe("summarize counts", () => {
  it("counts only booked meetings as meetings", () => {
    const stats = summary([
      call(day(0), "interested"),
      call(day(1), "interested"),
      call(day(2), "callback"),
      call(day(3), "meeting_booked"),
    ]);
    expect(stats.totals).toMatchObject({ meetings: 1, won: 3, conversations: 4 });
  });
});

describe("summarize series", () => {
  it("gives one point per day, oldest first, with empty days at zero", () => {
    const stats = summary([call(day(0)), call(day(0), "interested"), call(day(3))]);
    expect(stats.series).toHaveLength(7);
    expect(stats.series.map((p) => p.calls)).toEqual([0, 0, 0, 1, 0, 0, 2]);
    expect(stats.series.at(-1)).toMatchObject({ calls: 2, conversations: 1 });
    expect(stats.series[0].day).toBe(periodStart(NOW, 7));
  });

  it("puts a call just before midnight on that day, not the next", () => {
    const stats = summary([call(day(1, 23) + 59 * 60_000)]);
    expect(stats.series.map((p) => p.calls)).toEqual([0, 0, 0, 0, 0, 1, 0]);
  });
});

describe("summarize outcomes", () => {
  it("counts every outcome, in the queue's key order, zeros included", () => {
    const stats = summary([call(day(0), "interested"), call(day(1), "interested"), call(day(1), "no_answer")]);
    expect(stats.outcomes.map((o) => o.outcome)).toEqual([
      "no_answer",
      "voicemail",
      "gatekeeper",
      "callback",
      "interested",
      "meeting_booked",
      "not_interested",
      "wrong_number",
      "do_not_call",
    ]);
    expect(stats.outcomes.find((o) => o.outcome === "interested")?.count).toBe(2);
    expect(stats.outcomes.find((o) => o.outcome === "voicemail")?.count).toBe(0);
  });
});

describe("summarize by list", () => {
  const lists = ["Dentists", "Agencies"];

  it("splits the figures per list, busiest first", () => {
    const stats = summary(
      [
        call(day(0), "no_answer", 1),
        call(day(0), "interested", 0),
        call(day(1), "meeting_booked", 0),
        call(day(2), "no_answer", 0),
      ],
      7,
      lists,
    );
    expect(stats.byList).toEqual([
      { name: "Dentists", calls: 3, conversations: 2, rate: 2 / 3, won: 2, meetings: 1 },
      { name: "Agencies", calls: 1, conversations: 0, rate: 0, won: 0, meetings: 0 },
    ]);
  });

  it("sorts by calls even when the busiest list comes last in the names", () => {
    const stats = summary(
      [call(day(0), "no_answer", 0), call(day(0), "no_answer", 1), call(day(1), "no_answer", 1)],
      7,
      lists,
    );
    expect(stats.byList.map((r) => r.name)).toEqual(["Agencies", "Dentists"]);
  });

  it("gathers calls to leads with no list under one row", () => {
    const stats = summary([call(day(0), "no_answer", -1), call(day(1), "interested", 0)], 7, lists);
    expect(stats.byList.map((r) => r.name)).toEqual(["Dentists", "No list"]);
  });

  it("leaves out lists with no calls in the period", () => {
    const stats = summary([call(day(0), "no_answer", 0)], 7, lists);
    expect(stats.byList.map((r) => r.name)).toEqual(["Dentists"]);
  });
});

describe("change", () => {
  it("reads as a percentage against the period before", () => {
    expect(change(12, 10)).toEqual({ percent: 20, direction: "up" });
    expect(change(8, 10)).toEqual({ percent: -20, direction: "down" });
    expect(change(10, 10)).toEqual({ percent: 0, direction: "flat" });
  });

  it("says nothing when there is no earlier figure to compare with", () => {
    expect(change(5, 0)).toBeNull();
  });
});

describe("changeText", () => {
  it("gives the change against the period before", () => {
    expect(changeText(change(12, 10), 40, 7)).toBe("+20% vs previous 7 days");
    expect(changeText(change(8, 10), 40, 30)).toBe("-20% vs previous 30 days");
    expect(changeText(change(10, 10), 40, 7)).toBe("0% vs previous 7 days");
  });

  it("says the earlier figure was zero when there were calls then", () => {
    expect(changeText(change(3, 0), 50, 7)).toBe("0 in previous 7 days");
    expect(changeText(change(0, 0), 50, 7)).toBe("0 in previous 7 days");
  });

  it("only says there is no earlier data when there were no earlier calls", () => {
    expect(changeText(change(3, 0), 0, 7)).toBe("no earlier data to compare");
  });
});

describe("niceScale", () => {
  it.each([
    [1, { top: 1, step: 1 }],
    [5, { top: 5, step: 1 }],
    [7, { top: 8, step: 2 }],
    [34, { top: 40, step: 10 }],
    [58, { top: 60, step: 20 }],
    [101, { top: 150, step: 50 }],
  ])("picks round gridlines for a tallest bar of %i", (max, expected) => {
    expect(niceScale(max)).toEqual(expected);
  });

  it("never gives more than five gridline gaps", () => {
    for (let max = 1; max <= 3000; max += 7) {
      const { top, step } = niceScale(max);
      expect(top).toBeGreaterThanOrEqual(max);
      expect(top / step).toBeLessThanOrEqual(5);
    }
  });
});
