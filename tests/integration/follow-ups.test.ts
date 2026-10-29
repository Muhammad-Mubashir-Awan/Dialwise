import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { recordCall } from "@/lib/data/calls";
import { followUpTimes, listFollowUps } from "@/lib/data/follow-ups";
import { navCounts } from "@/lib/data/queue";
import { getSettings } from "@/lib/data/settings";
import { calls, type LeadStatus, leads } from "@/lib/db/schema";
import { createTestDb, resetTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
beforeEach(async () => {
  await resetTestDb(db);
});
afterAll(async () => {
  await close();
});

const NOW = new Date("2026-10-29T12:00:00Z");
const later = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

let seq = 0;
async function addLead(
  name: string,
  fields: { status?: LeadStatus; nextFollowUpAt?: Date | null; company?: string } = {},
) {
  seq += 1;
  const [lead] = await db
    .insert(leads)
    .values({ name, phoneE164: `+44207946${String(seq).padStart(4, "0")}`, phoneRaw: "x", ...fields })
    .returning();
  return lead.id;
}

describe("listFollowUps", () => {
  it("lists follow-ups and meetings up to a time, soonest first, with the last call's note", async () => {
    const amelia = await addLead("Amelia", { status: "callback", nextFollowUpAt: later(-2), company: "Brightpath" });
    await db.insert(calls).values([
      { leadId: amelia, outcome: "no_answer", calledAt: later(-50) },
      { leadId: amelia, outcome: "callback", note: "Call after the board meeting", calledAt: later(-26) },
    ]);
    await addLead("Grace", { status: "meeting_booked", nextFollowUpAt: later(30) });
    await addLead("Marcus", { status: "interested", nextFollowUpAt: later(3) });
    await addLead("Too far ahead", { status: "callback", nextFollowUpAt: later(500) });
    await addLead("No follow-up");

    const result = await listFollowUps(db, { until: later(48) });
    expect(result.total).toBe(3);
    expect(result.items.map((i) => [i.name, i.status, i.at])).toEqual([
      ["Amelia", "callback", later(-2)],
      ["Marcus", "interested", later(3)],
      ["Grace", "meeting_booked", later(30)],
    ]);
    expect(result.items[0]).toMatchObject({ company: "Brightpath", lastNote: "Call after the board meeting" });
    expect(result.items[1].lastNote).toBeNull();
  });

  it("leaves out leads that are do not call, not interested or a bad number", async () => {
    for (const status of ["do_not_call", "not_interested", "bad_number"] as LeadStatus[]) {
      await addLead(status, { status, nextFollowUpAt: later(1) });
    }
    await addLead("Still open", { status: "callback", nextFollowUpAt: later(1) });
    expect((await listFollowUps(db, { until: later(48) })).items.map((i) => i.name)).toEqual(["Still open"]);
  });

  it("drops a follow-up once a new call is logged without one", async () => {
    const id = await addLead("Priya", { status: "callback", nextFollowUpAt: later(-1) });
    expect((await listFollowUps(db, { until: later(48) })).total).toBe(1);
    await recordCall(db, { leadId: id, outcome: "no_answer", note: "", followUpAt: null, now: NOW });
    expect((await listFollowUps(db, { until: later(48) })).total).toBe(0);
  });

  it("moves a follow-up when a new call sets another one", async () => {
    const id = await addLead("Priya", { status: "callback", nextFollowUpAt: later(-1) });
    await recordCall(db, { leadId: id, outcome: "callback", note: "Try Monday", followUpAt: later(72), now: NOW });
    expect((await listFollowUps(db, { until: later(48) })).total).toBe(0);
    expect((await listFollowUps(db, { until: later(100) })).items[0]).toMatchObject({
      at: later(72),
      lastNote: "Try Monday",
    });
  });

  it("returns at most the limit, with the full count", async () => {
    for (const name of ["A", "B", "C"]) await addLead(name, { status: "callback", nextFollowUpAt: later(1) });
    const result = await listFollowUps(db, { until: later(48), limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});

describe("followUpTimes", () => {
  it("lists the times of follow-ups up to a time, for the sidebar count", async () => {
    await addLead("Overdue", { status: "callback", nextFollowUpAt: later(-5) });
    await addLead("Soon", { status: "interested", nextFollowUpAt: later(4) });
    await addLead("Closed", { status: "not_interested", nextFollowUpAt: later(1) });
    await addLead("Next week", { status: "callback", nextFollowUpAt: later(200) });
    expect(await followUpTimes(db, { until: later(24) })).toEqual([later(-5), later(4)]);
  });
});

describe("navCounts", () => {
  it("counts leads ready to call now and all leads", async () => {
    await addLead("Ready");
    await addLead("Also ready");
    await addLead("Closed", { status: "do_not_call" });
    await addLead("Later", { status: "callback", nextFollowUpAt: later(5) });
    expect(await navCounts(db, { now: NOW, settings: await getSettings(db) })).toEqual({ ready: 2, leads: 4 });
  });
});
