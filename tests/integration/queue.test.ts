import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getQueue, readyCountsByList } from "@/lib/data/queue";
import { getSettings } from "@/lib/data/settings";
import { type CallOutcome, calls, type LeadStatus, leads, lists, settings, type Settings } from "@/lib/db/schema";
import { createTestDb, resetTestDb, type TestDb } from "../helpers/db";

let db: TestDb;
let close: () => Promise<void>;
let defaults: Settings;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
});
beforeEach(async () => {
  await resetTestDb(db);
  defaults = await getSettings(db);
});
afterAll(async () => {
  await close();
});

// Thursday 29 October 2026, 12:00 UTC: 12:00 in London, 17:00 in Karachi, 08:00 in New York, 23:00 in Sydney.
const NOW = new Date("2026-10-29T12:00:00Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

let seq = 0;
async function addLead(
  name: string,
  fields: {
    timezone?: string | null;
    status?: LeadStatus;
    listId?: string;
    nextFollowUpAt?: Date;
    createdAt?: Date;
  } = {},
) {
  seq += 1;
  const [lead] = await db
    .insert(leads)
    .values({
      name,
      phoneE164: `+44207946${String(seq).padStart(4, "0")}`,
      phoneRaw: "x",
      timezone: fields.timezone ?? null,
      status: fields.status ?? "new",
      listId: fields.listId,
      nextFollowUpAt: fields.nextFollowUpAt,
      createdAt: fields.createdAt ?? new Date(Date.UTC(2026, 9, 1, 0, seq)),
    })
    .returning();
  return lead.id;
}

async function addCall(leadId: string, outcome: CallOutcome, hoursAgo: number) {
  await db.insert(calls).values({ leadId, outcome, calledAt: hoursFromNow(-hoursAgo) });
}

const queue = (options: Partial<Parameters<typeof getQueue>[1]> = {}) =>
  getQueue(db, { now: NOW, settings: defaults, ...options });
const readyNames = async (options: Partial<Parameters<typeof getQueue>[1]> = {}) =>
  (await queue(options)).ready.map((l) => l.name);

describe("getQueue order", () => {
  it("serves due follow-ups (oldest first), then never-called leads (oldest added first), then the rest (oldest call first)", async () => {
    const a = await addLead("Called 30h ago");
    await addCall(a, "gatekeeper", 30);
    const b = await addLead("Called 50h ago");
    await addCall(b, "no_answer", 50);
    await addLead("Never called, added first", { createdAt: new Date("2026-10-01") });
    await addLead("Never called, added second", { createdAt: new Date("2026-10-02") });
    const e = await addLead("Due 1h ago", { status: "callback", nextFollowUpAt: hoursFromNow(-1) });
    await addCall(e, "callback", 26);
    await addLead("Due 3h ago", { status: "interested", nextFollowUpAt: hoursFromNow(-3) });

    expect(await readyNames()).toEqual([
      "Due 3h ago",
      "Due 1h ago",
      "Never called, added first",
      "Never called, added second",
      "Called 50h ago",
      "Called 30h ago",
    ]);
  });

  it("returns up to the limit, with the full count", async () => {
    for (const name of ["A", "B", "C", "D", "E"]) await addLead(name);
    const result = await queue({ limit: 2 });
    expect(result.ready).toHaveLength(2);
    expect(result.counts.ready).toBe(5);
  });
});

describe("getQueue leaves leads out", () => {
  it("never serves closed-out leads, even with a follow-up due", async () => {
    for (const status of ["meeting_booked", "not_interested", "do_not_call", "bad_number"] as LeadStatus[]) {
      await addLead(status, { status, nextFollowUpAt: hoursFromNow(-1) });
    }
    await addLead("Open lead");
    expect(await readyNames()).toEqual(["Open lead"]);
  });

  it("holds a follow-up set for later until it's due, then serves it first", async () => {
    await addLead("Never called");
    await addLead("Call back in 2h", { status: "callback", nextFollowUpAt: hoursFromNow(2) });

    const before = await queue();
    expect(before.ready.map((l) => l.name)).toEqual(["Never called"]);
    expect(before.counts.scheduled).toBe(1);

    const after = await queue({ now: hoursFromNow(3) });
    expect(after.ready.map((l) => l.name)).toEqual(["Call back in 2h", "Never called"]);
  });

  it("waits the retry gap after no answer or voicemail, but not after a gatekeeper", async () => {
    await addCall(await addLead("No answer 2h ago"), "no_answer", 2);
    await addCall(await addLead("Voicemail 2h ago"), "voicemail", 2);
    await addCall(await addLead("Gatekeeper 2h ago"), "gatekeeper", 2);
    await addCall(await addLead("No answer 25h ago"), "no_answer", 25);

    const result = await queue();
    expect(result.ready.map((l) => l.name)).toEqual(["No answer 25h ago", "Gatekeeper 2h ago"]);
    expect(result.counts.waiting).toBe(2);
  });

  it("only looks at the latest call for the retry gap", async () => {
    const id = await addLead("Gatekeeper after no answer");
    await addCall(id, "no_answer", 3);
    await addCall(id, "gatekeeper", 2);
    expect(await readyNames()).toEqual(["Gatekeeper after no answer"]);
  });

  it("serves a due follow-up even inside the retry gap", async () => {
    const id = await addLead("Due, no answer 2h ago", { status: "callback", nextFollowUpAt: hoursFromNow(-1) });
    await addCall(id, "no_answer", 2);
    expect(await readyNames()).toEqual(["Due, no answer 2h ago"]);
  });

  it("uses the retry gap from settings", async () => {
    await addCall(await addLead("No answer 2h ago"), "no_answer", 2);
    expect(await readyNames({ settings: { ...defaults, retryGapHours: 1 } })).toEqual(["No answer 2h ago"]);
  });
});

describe("getQueue call hours", () => {
  beforeEach(async () => {
    await addLead("London", { timezone: "Europe/London" });
    await addLead("Karachi", { timezone: "Asia/Karachi" });
    await addLead("New York", { timezone: "America/New_York" });
    await addLead("Sydney", { timezone: "Australia/Sydney" });
    await addLead("Unknown zone");
  });

  it("serves leads inside their own call hours, and leads with no known zone", async () => {
    const result = await queue();
    expect(result.ready.map((l) => l.name).sort()).toEqual(["Karachi", "London", "Unknown zone"]);
    expect(result.counts.outside).toBe(2);
  });

  it("serves only leads with no known zone on a Saturday", async () => {
    expect(await readyNames({ now: new Date("2026-10-31T12:00:00Z") })).toEqual(["Unknown zone"]);
  });

  it("follows the call hours in settings", async () => {
    const early = { ...defaults, callWindowStart: "07:00:00", callWindowEnd: "16:00:00" };
    expect((await readyNames({ settings: early })).sort()).toEqual(["London", "New York", "Unknown zone"]);
  });

  it("says when the next window opens if nobody can be called now", async () => {
    await db.delete(leads).where(eq(leads.name, "London"));
    await db.delete(leads).where(eq(leads.name, "Karachi"));
    await db.delete(leads).where(eq(leads.name, "Unknown zone"));

    const result = await queue();
    expect(result.ready).toEqual([]);
    expect(result.nextOpen).toMatchObject({ name: "New York", at: new Date("2026-10-29T13:00:00Z") });
  });
});

describe("getQueue scope and picked leads", () => {
  it("works one list at a time", async () => {
    const [list] = await db.insert(lists).values({ name: "Dentists" }).returning();
    await addLead("In the list", { listId: list.id });
    await addLead("Elsewhere");
    const result = await queue({ listId: list.id });
    expect(result.ready.map((l) => l.name)).toEqual(["In the list"]);
    expect(result.counts.ready).toBe(1);
    expect(result.ready[0].listName).toBe("Dentists");
  });

  it("returns a picked lead even when it isn't ready", async () => {
    const id = await addLead("New York", { timezone: "America/New_York" });
    const result = await queue({ pinnedId: id });
    expect(result.pinned?.name).toBe("New York");
    expect(result.pinnedProblem).toBeNull();
    expect(result.ready).toEqual([]);
  });

  it("refuses to pick a do-not-call lead", async () => {
    const id = await addLead("Asked not to be called", { status: "do_not_call" });
    expect(await queue({ pinnedId: id })).toMatchObject({ pinned: null, pinnedProblem: "do_not_call" });
  });

  it("reports a picked lead that doesn't exist", async () => {
    expect(await queue({ pinnedId: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60" })).toMatchObject({
      pinned: null,
      pinnedProblem: "not_found",
    });
    expect((await queue({ pinnedId: "nope" })).pinnedProblem).toBe("not_found");
  });

  it("includes each lead's last call and its three most recent calls", async () => {
    const id = await addLead("Busy");
    await addCall(id, "no_answer", 100);
    await addCall(id, "voicemail", 80);
    await addCall(id, "gatekeeper", 60);
    await addCall(id, "callback", 40);
    const [lead] = (await queue()).ready;
    expect(lead.lastCall).toEqual({ outcome: "callback", calledAt: hoursFromNow(-40) });
    expect(lead.recentCalls.map((c) => c.outcome)).toEqual(["callback", "gatekeeper", "voicemail"]);
  });
});

describe("readyCountsByList", () => {
  it("counts the leads ready now in each list", async () => {
    const [dentists] = await db.insert(lists).values({ name: "Dentists" }).returning();
    const [agencies] = await db.insert(lists).values({ name: "Agencies" }).returning();
    await addLead("Ready", { listId: dentists.id });
    await addLead("Also ready", { listId: dentists.id });
    await addLead("Outside hours", { listId: dentists.id, timezone: "America/New_York" });
    await addLead("Closed", { listId: agencies.id, status: "not_interested" });
    await addLead("No list");

    expect(await readyCountsByList(db, { now: NOW, settings: defaults })).toEqual({ [dentists.id]: 2 });
  });
});

describe("settings row", () => {
  it("is used as given (sanity check for the tests above)", async () => {
    const [row] = await db.select().from(settings);
    expect(row.retryGapHours).toBe(24);
  });
});
