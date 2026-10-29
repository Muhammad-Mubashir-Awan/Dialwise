import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { allLists, createList, deleteList, listSummaries, renameList } from "@/lib/data/lists";
import { getSettings } from "@/lib/data/settings";
import { calls, leads } from "@/lib/db/schema";
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

const UNKNOWN_ID = "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60";

async function addLead(listId: string | null, phoneE164: string, status: typeof leads.$inferInsert.status = "new") {
  const [lead] = await db
    .insert(leads)
    .values({ name: "Lead", phoneE164, phoneRaw: phoneE164, listId, status })
    .returning();
  return lead.id;
}

describe("createList", () => {
  it("creates a list", async () => {
    const result = await createList(db, "Dental clinics");
    expect(result).toMatchObject({ ok: true });
    expect(await allLists(db)).toEqual([{ id: result.ok && result.id, name: "Dental clinics" }]);
  });

  it("refuses a name that's already used, whatever the case", async () => {
    await createList(db, "Dental clinics");
    expect(await createList(db, "dental CLINICS")).toEqual({
      ok: false,
      error: "You already have a list called that.",
    });
  });
});

describe("renameList", () => {
  it("renames the list, and allows changing only the case", async () => {
    const created = await createList(db, "Dental clinics");
    const id = created.ok ? created.id : "";
    expect(await renameList(db, id, "Dental Clinics")).toEqual({ ok: true });
    expect((await allLists(db))[0].name).toBe("Dental Clinics");
  });

  it("refuses another list's name", async () => {
    await createList(db, "Dental clinics");
    const other = await createList(db, "Design agencies");
    expect(await renameList(db, other.ok ? other.id : "", "Dental clinics")).toEqual({
      ok: false,
      error: "You already have a list called that.",
    });
  });

  it("reports a list that no longer exists", async () => {
    expect(await renameList(db, UNKNOWN_ID, "Anything")).toEqual({ ok: false, error: "That list was deleted." });
  });
});

describe("deleteList", () => {
  it("deletes the list but keeps its leads, with no list", async () => {
    const created = await createList(db, "Dental clinics");
    const id = created.ok ? created.id : "";
    const leadId = await addLead(id, "+12125550142");

    expect(await deleteList(db, id)).toBe("Dental clinics");
    expect(await allLists(db)).toEqual([]);
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    expect(lead.listId).toBeNull();
  });

  it("returns null when there's nothing to delete", async () => {
    expect(await deleteList(db, UNKNOWN_ID)).toBeNull();
  });
});

describe("listSummaries", () => {
  it("counts leads, never-called leads, calls, conversations and wins per list", async () => {
    const dental = await createList(db, "Dental clinics");
    const empty = await createList(db, "Accountants");
    const dentalId = dental.ok ? dental.id : "";

    const priya = await addLead(dentalId, "+12125550142", "interested");
    const marcus = await addLead(dentalId, "+13125550178", "contacted");
    await addLead(dentalId, "+14155550119");
    await addLead(null, "+442079460118");
    await db.insert(calls).values([
      { leadId: priya, outcome: "no_answer" },
      { leadId: priya, outcome: "interested" },
      { leadId: marcus, outcome: "voicemail" },
      { leadId: marcus, outcome: "callback" },
    ]);

    const summaries = await listSummaries(db);
    expect(summaries.map((s) => s.name)).toEqual(["Accountants", "Dental clinics"]);
    expect(summaries.find((s) => s.id === dentalId)).toEqual({
      id: dentalId,
      name: "Dental clinics",
      leads: 3,
      neverCalled: 1,
      calls: 4,
      conversations: 2,
      interestedOrBooked: 1,
    });
    expect(summaries.find((s) => s.id === (empty.ok && empty.id))).toMatchObject({ leads: 0, calls: 0 });
  });
});

describe("getSettings", () => {
  it("reads the settings row", async () => {
    expect(await getSettings(db)).toMatchObject({
      callWindowStart: "09:00:00",
      callWindowEnd: "18:00:00",
      callDays: [1, 2, 3, 4, 5],
      retryGapHours: 24,
      defaultCountry: "GB",
    });
  });

  it("falls back to the defaults if the row is missing", async () => {
    await db.execute("delete from settings");
    expect(await getSettings(db)).toMatchObject({ callWindowStart: "09:00:00", defaultCountry: "GB" });
  });
});
