import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getStatsCalls } from "@/lib/data/stats";
import { calls, leads, lists } from "@/lib/db/schema";
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
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000);

let seq = 0;
async function addLead(listId: string | null) {
  seq += 1;
  const [lead] = await db
    .insert(leads)
    .values({ name: `Lead ${seq}`, phoneE164: `+44207947${String(seq).padStart(4, "0")}`, phoneRaw: "x", listId })
    .returning();
  return lead.id;
}

describe("getStatsCalls", () => {
  it("returns calls since the given time, oldest first, with the lead's list as an index", async () => {
    const [dentists, agencies] = await db
      .insert(lists)
      .values([{ name: "Dentists" }, { name: "Agencies" }])
      .returning();
    const inDentists = await addLead(dentists.id);
    const inAgencies = await addLead(agencies.id);
    const noList = await addLead(null);
    await db.insert(calls).values([
      { leadId: noList, outcome: "voicemail", calledAt: hoursAgo(1) },
      { leadId: inDentists, outcome: "interested", calledAt: hoursAgo(30) },
      { leadId: inAgencies, outcome: "no_answer", calledAt: hoursAgo(5) },
    ]);

    const result = await getStatsCalls(db, hoursAgo(48));

    // Lists come back by name, so Agencies is 0 and Dentists is 1.
    expect(result.lists).toEqual(["Agencies", "Dentists"]);
    expect(result.calls).toEqual([
      { at: hoursAgo(30).getTime(), outcome: "interested", list: 1 },
      { at: hoursAgo(5).getTime(), outcome: "no_answer", list: 0 },
      { at: hoursAgo(1).getTime(), outcome: "voicemail", list: -1 },
    ]);
  });

  it("leaves out calls from before the given time", async () => {
    const lead = await addLead(null);
    await db.insert(calls).values([
      { leadId: lead, outcome: "no_answer", calledAt: hoursAgo(100) },
      { leadId: lead, outcome: "voicemail", calledAt: hoursAgo(2) },
    ]);
    const result = await getStatsCalls(db, hoursAgo(48));
    expect(result.calls.map((c) => c.outcome)).toEqual(["voicemail"]);
  });

  it("keeps a call when its lead's list was deleted", async () => {
    const [list] = await db.insert(lists).values({ name: "Gone" }).returning();
    const lead = await addLead(list.id);
    await db.insert(calls).values({ leadId: lead, outcome: "callback", calledAt: hoursAgo(1) });
    await db.delete(lists);
    const result = await getStatsCalls(db, hoursAgo(48));
    expect(result.lists).toEqual([]);
    expect(result.calls).toEqual([{ at: hoursAgo(1).getTime(), outcome: "callback", list: -1 }]);
  });

  it("is empty when nothing was called", async () => {
    expect(await getStatsCalls(db, hoursAgo(48))).toEqual({ calls: [], lists: [] });
  });
});
