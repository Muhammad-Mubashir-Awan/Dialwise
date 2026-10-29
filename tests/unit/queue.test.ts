import { describe, expect, it } from "vitest";
import { arrangeQueue, followUpChoices, queueHref, queueReason } from "@/lib/queue";

// Thursday 29 October 2026, 12:00 UTC.
const NOW = new Date("2026-10-29T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe("arrangeQueue", () => {
  const ready = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const ids = (list: { id: string }[]) => list.map((l) => l.id);

  it("keeps the server's order", () => {
    expect(ids(arrangeQueue(ready, {}))).toEqual(["a", "b", "c", "d"]);
  });

  it("moves skipped leads to the back, in the order they were skipped", () => {
    expect(ids(arrangeQueue(ready, { skipped: ["b", "a"] }))).toEqual(["c", "d", "b", "a"]);
  });

  it("puts a picked lead first, even one that isn't ready", () => {
    expect(ids(arrangeQueue(ready, { pinned: { id: "c" } }))).toEqual(["c", "a", "b", "d"]);
    expect(ids(arrangeQueue(ready, { pinned: { id: "z" } }))).toEqual(["z", "a", "b", "c", "d"]);
  });

  it("leaves out leads just logged, until the server catches up", () => {
    expect(ids(arrangeQueue(ready, { hidden: ["a", "c"], skipped: ["c"] }))).toEqual(["b", "d"]);
  });
});

describe("queueReason", () => {
  it("flags a follow-up that is due", () => {
    expect(queueReason({ nextFollowUpAt: hoursAgo(1.5), lastCall: null }, NOW)).toEqual({
      text: "Follow-up due 1h 30m ago",
      due: true,
    });
  });

  it("says it's the first call when there's no history", () => {
    expect(queueReason({ nextFollowUpAt: null, lastCall: null }, NOW)).toEqual({ text: "First call", due: false });
  });

  it("describes the last call", () => {
    expect(
      queueReason({ nextFollowUpAt: null, lastCall: { outcome: "no_answer", calledAt: hoursAgo(26) } }, NOW),
    ).toEqual({ text: "Last call 1 day ago · No answer", due: false });
  });
});

describe("followUpChoices", () => {
  it("offers in 2 hours, tomorrow and Monday at 10:00 their time, and in a week", () => {
    expect(followUpChoices("Europe/London", NOW)).toEqual([
      { id: "2h", label: "In 2 hours", at: new Date("2026-10-29T14:00:00Z") },
      { id: "tomorrow", label: "Tomorrow 10:00", at: new Date("2026-10-30T10:00:00Z") },
      { id: "monday", label: "Monday 10:00", at: new Date("2026-11-02T10:00:00Z") },
      { id: "week", label: "In 1 week", at: new Date("2026-11-05T12:00:00Z") },
    ]);
  });

  it("uses the lead's clock, across a daylight-saving change", () => {
    const [, tomorrow, monday] = followUpChoices("America/New_York", NOW);
    expect(tomorrow.at).toEqual(new Date("2026-10-30T14:00:00Z")); // 10:00 EDT
    expect(monday.at).toEqual(new Date("2026-11-02T15:00:00Z")); // 10:00 EST
  });

  it("means next week's Monday on a Monday", () => {
    const monday = new Date("2026-11-02T08:00:00Z");
    expect(followUpChoices("Europe/London", monday)[2].at).toEqual(new Date("2026-11-09T10:00:00Z"));
  });
});

describe("queueHref", () => {
  it("links to the queue with an optional list and picked lead", () => {
    expect(queueHref(null)).toBe("/queue");
    expect(queueHref("list-1")).toBe("/queue?list=list-1");
    expect(queueHref("list-1", "lead-2")).toBe("/queue?list=list-1&lead=lead-2");
    expect(queueHref(null, "lead-2")).toBe("/queue?lead=lead-2");
  });
});
