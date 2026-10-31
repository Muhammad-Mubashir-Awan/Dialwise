import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { chunkRows, planImport } from "@/lib/csv";
import { importLeads, phoneStatuses } from "@/lib/data/import";
import { type LeadStatus, leads, lists } from "@/lib/db/schema";
import type { RawImportLead } from "@/lib/lead-input";
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

const raw = (phone: string, name = "Lead", more: Partial<RawImportLead> = {}): RawImportLead => ({
  name,
  company: "",
  role: "",
  industry: "",
  phone,
  email: "",
  website: "",
  country: "",
  tags: "",
  notes: "",
  ...more,
});
const ukPhone = (n: number) => `020 7946 ${String(n).padStart(4, "0")}`;
const ukE164 = (n: number) => `+44207946${String(n).padStart(4, "0")}`;

async function existing(e164: string, status: LeadStatus = "new") {
  await db.insert(leads).values({ name: "Already here", phoneE164: e164, phoneRaw: e164, status });
}

describe("importLeads", () => {
  it("adds new leads with their list and source, and skips numbers already in the CRM", async () => {
    const [list] = await db.insert(lists).values({ name: "Dentists" }).returning();
    await existing(ukE164(2));
    const plan = planImport([raw(ukPhone(1), "Amelia"), raw(ukPhone(2), "Duplicate")], {
      defaultCountry: "GB",
      listId: list.id,
    });

    const result = await importLeads(
      db,
      plan.valid.map((v) => v.values),
      { source: "Import: dentists.csv" },
    );

    expect(result).toEqual({ ok: true, added: 1, duplicates: 1, doNotCall: 0 });
    const [amelia] = await db.select().from(leads).where(eq(leads.name, "Amelia"));
    expect(amelia).toMatchObject({
      listId: list.id,
      source: "Import: dentists.csv",
      status: "new",
      timezone: "Europe/London",
    });
  });

  it("never touches a do-not-call lead and counts it separately", async () => {
    await existing(ukE164(3), "do_not_call");
    const plan = planImport([raw(ukPhone(3), "Back again")], { defaultCountry: "GB", listId: null });

    expect(
      await importLeads(
        db,
        plan.valid.map((v) => v.values),
        { source: null },
      ),
    ).toEqual({
      ok: true,
      added: 0,
      duplicates: 0,
      doNotCall: 1,
    });
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.phoneE164, ukE164(3)));
    expect(lead).toMatchObject({ name: "Already here", status: "do_not_call" });
  });

  it("says so when the list was deleted meanwhile, and adds nothing", async () => {
    const plan = planImport([raw(ukPhone(4))], {
      defaultCountry: "GB",
      listId: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60",
    });
    expect(
      await importLeads(
        db,
        plan.valid.map((v) => v.values),
        { source: null },
      ),
    ).toEqual({
      ok: false,
      error: "That list was deleted. Pick another one.",
    });
    expect(await db.select().from(leads)).toEqual([]);
  });

  it("does nothing for an empty batch", async () => {
    expect(await importLeads(db, [], { source: null })).toEqual({ ok: true, added: 0, duplicates: 0, doNotCall: 0 });
  });

  // Real work (940 numbers checked, two 500-row inserts): allow for a busy machine running every test file at once.
  it("imports a 1,000-row file in batches of 500 with the right summary", { timeout: 30_000 }, async () => {
    // 1,000 rows: 940 distinct numbers (10 already in the CRM, 5 of those do not call),
    // 40 rows repeating an earlier number, and 20 rows without a usable number.
    for (let n = 1; n <= 10; n++) await existing(ukE164(n), n <= 5 ? "do_not_call" : "new");
    const rows: RawImportLead[] = [];
    for (let n = 1; n <= 940; n++) rows.push(raw(ukPhone(n), `Lead ${n}`));
    for (let n = 1; n <= 40; n++) rows.push(raw(ukPhone(100 + n), `Repeat ${n}`));
    for (let n = 1; n <= 20; n++) rows.push(raw("n/a", `No phone ${n}`));

    const plan = planImport(rows, { defaultCountry: "GB", listId: null });
    expect([plan.valid.length, plan.repeated, plan.invalid.length]).toEqual([940, 40, 20]);

    const totals = { added: 0, duplicates: 0, doNotCall: 0 };
    const batches = chunkRows(
      plan.valid.map((v) => v.values),
      { maxRows: 500, maxBytes: 700_000 },
    );
    expect(batches.map((b) => b.length)).toEqual([500, 440]);
    for (const batch of batches) {
      const result = await importLeads(db, batch, { source: "Import: big.csv" });
      if (!result.ok) throw new Error(result.error);
      totals.added += result.added;
      totals.duplicates += result.duplicates;
      totals.doNotCall += result.doNotCall;
    }

    expect(totals).toEqual({ added: 930, duplicates: 5, doNotCall: 5 });
    expect(await db.$count(leads)).toBe(940);
    const doNotCall = await db
      .select({ name: leads.name })
      .from(leads)
      .where(eq(leads.status, "do_not_call"))
      .orderBy(asc(leads.name));
    expect(doNotCall.every((l) => l.name === "Already here")).toBe(true);
  });
});

describe("phoneStatuses", () => {
  it("counts numbers already in the CRM, and how many of them are do not call", async () => {
    await existing(ukE164(1));
    await existing(ukE164(2), "do_not_call");
    expect(await phoneStatuses(db, [ukE164(1), ukE164(2), ukE164(3)])).toEqual({ existing: 1, doNotCall: 1 });
    expect(await phoneStatuses(db, [])).toEqual({ existing: 0, doNotCall: 0 });
  });
});
