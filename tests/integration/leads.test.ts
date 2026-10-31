import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createLead, deleteLead, findLeads, getLead, leadTags, updateLead } from "@/lib/data/leads";
import { calls, leads, lists } from "@/lib/db/schema";
import type { LeadValues } from "@/lib/lead-input";
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

let phoneSeq = 0;
const values = (overrides: Partial<LeadValues> = {}): LeadValues => {
  phoneSeq += 1;
  return {
    name: "Amelia Hart",
    role: null,
    industry: null,
    company: null,
    phoneRaw: "020 7946 0118",
    phoneE164: `+44207946${String(phoneSeq).padStart(4, "0")}`,
    country: "GB",
    timezone: "Europe/London",
    email: null,
    website: null,
    listId: null,
    tags: [],
    notes: null,
    ...overrides,
  };
};

async function addList(name: string) {
  const [list] = await db.insert(lists).values({ name }).returning();
  return list;
}

async function add(overrides: Partial<LeadValues> = {}) {
  const result = await createLead(db, values(overrides));
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.id;
}

describe("createLead", () => {
  it("saves the lead as new and returns its id", async () => {
    const result = await createLead(db, values({ name: "Amelia Hart", tags: ["saas"] }));
    expect(result).toMatchObject({ ok: true, name: "Amelia Hart" });

    const [row] = await db.select().from(leads);
    expect(row).toMatchObject({ name: "Amelia Hart", status: "new", tags: ["saas"], phoneRaw: "020 7946 0118" });
    expect(result.ok && result.id).toBe(row.id);
  });

  it("names the lead that already has the number", async () => {
    await add({ name: "Amelia Hart", phoneE164: "+442079460118" });
    const result = await createLead(db, values({ name: "Someone Else", phoneE164: "+442079460118" }));
    expect(result).toEqual({ ok: false, errors: { phone: "Amelia Hart already has this number." } });
  });

  it("says so when the chosen list was deleted meanwhile", async () => {
    const result = await createLead(db, values({ listId: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60" }));
    expect(result).toEqual({ ok: false, errors: { listId: "That list was deleted. Pick another one." } });
  });
});

describe("updateLead", () => {
  it("saves the changes and keeps status and call history", async () => {
    const id = await add({ name: "Amelia Hart" });
    await db.update(leads).set({ status: "interested" }).where(eq(leads.id, id));
    await db.insert(calls).values({ leadId: id, outcome: "interested" });

    const result = await updateLead(db, id, values({ name: "Amelia Hart-Jones", company: "Brightpath" }));
    expect(result).toEqual({ ok: true, id, name: "Amelia Hart-Jones" });

    const lead = await getLead(db, id);
    expect(lead).toMatchObject({ name: "Amelia Hart-Jones", company: "Brightpath", status: "interested" });
    expect(lead?.calls).toHaveLength(1);
  });

  it("lets a lead keep its own number", async () => {
    const id = await add({ phoneE164: "+442079460118" });
    const result = await updateLead(db, id, values({ phoneE164: "+442079460118", notes: "Prefers mornings" }));
    expect(result.ok).toBe(true);
  });

  it("refuses another lead's number", async () => {
    await add({ name: "Amelia Hart", phoneE164: "+442079460118" });
    const id = await add({ name: "Oliver Brandt" });
    const result = await updateLead(db, id, values({ phoneE164: "+442079460118" }));
    expect(result).toEqual({ ok: false, errors: { phone: "Amelia Hart already has this number." } });
  });

  it("reports a lead that no longer exists", async () => {
    const result = await updateLead(db, "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60", values());
    expect(result).toEqual({ ok: false, errors: {}, notFound: true });
  });
});

describe("deleteLead", () => {
  it("deletes the lead with its calls and returns its name", async () => {
    const id = await add({ name: "Amelia Hart" });
    await db.insert(calls).values({ leadId: id, outcome: "no_answer" });

    expect(await deleteLead(db, id)).toBe("Amelia Hart");
    expect(await db.select().from(leads)).toEqual([]);
    expect(await db.select().from(calls)).toEqual([]);
  });

  it("returns null when there's nothing to delete", async () => {
    expect(await deleteLead(db, "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60")).toBeNull();
  });
});

describe("getLead", () => {
  it("returns the lead with its list and its calls, newest first", async () => {
    const list = await addList("Dental clinics");
    const id = await add({ name: "Priya Nair", listId: list.id });
    await db.insert(calls).values([
      { leadId: id, outcome: "no_answer", calledAt: new Date("2026-10-01T10:00:00Z") },
      { leadId: id, outcome: "voicemail", note: "Left a message", calledAt: new Date("2026-10-02T10:00:00Z") },
    ]);

    const lead = await getLead(db, id);
    expect(lead).toMatchObject({ name: "Priya Nair", listName: "Dental clinics" });
    expect(lead?.calls.map((c) => c.outcome)).toEqual(["voicemail", "no_answer"]);
  });

  it("returns null for an unknown or malformed id", async () => {
    expect(await getLead(db, "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60")).toBeNull();
    expect(await getLead(db, "not-a-uuid")).toBeNull();
  });
});

describe("findLeads", () => {
  async function seed() {
    const dental = await addList("Dental clinics");
    const saas = await addList("UK SaaS founders");
    await add({
      name: "Amelia Hart",
      company: "Brightpath Analytics",
      phoneE164: "+442079460118",
      listId: saas.id,
      tags: ["saas", "warm"],
    });
    await add({
      name: "Priya Nair",
      company: "Smile Avenue Dental",
      phoneE164: "+12125550142",
      listId: dental.id,
      tags: ["dental"],
    });
    await add({
      name: "Rohan Mehta",
      company: "Northwind Labs",
      phoneE164: "+912255550101",
      email: "rohan@northwind.example",
      tags: ["saas"],
    });
    return { dental, saas };
  }
  const names = (result: { rows: { name: string }[] }) => result.rows.map((r) => r.name).sort();

  it("lists every lead with its list name and the total", async () => {
    await seed();
    const result = await findLeads(db, {});
    expect(result.total).toBe(3);
    expect(result.matching).toBe(3);
    expect(result.rows.find((r) => r.name === "Priya Nair")?.listName).toBe("Dental clinics");
    expect(result.rows.find((r) => r.name === "Rohan Mehta")?.listName).toBeNull();
  });

  it("shows the newest leads first", async () => {
    await db.insert(leads).values([
      { name: "Older", phoneE164: "+442079460001", phoneRaw: "x", createdAt: new Date("2026-01-01") },
      { name: "Newer", phoneE164: "+442079460002", phoneRaw: "x", createdAt: new Date("2026-02-01") },
    ]);
    expect((await findLeads(db, {})).rows.map((r) => r.name)).toEqual(["Newer", "Older"]);
  });

  it("searches name, company and email, ignoring case", async () => {
    await seed();
    expect(names(await findLeads(db, { q: "amelia" }))).toEqual(["Amelia Hart"]);
    expect(names(await findLeads(db, { q: "SMILE" }))).toEqual(["Priya Nair"]);
    expect(names(await findLeads(db, { q: "northwind.example" }))).toEqual(["Rohan Mehta"]);
  });

  it("searches phone numbers typed with or without the country code", async () => {
    await seed();
    expect(names(await findLeads(db, { q: "7946 0118" }))).toEqual(["Amelia Hart"]);
    expect(names(await findLeads(db, { q: "020 7946 0118" }))).toEqual(["Amelia Hart"]);
    expect(names(await findLeads(db, { q: "+1 212" }))).toEqual(["Priya Nair"]);
  });

  it("treats % and _ in a search as plain characters", async () => {
    await seed();
    expect((await findLeads(db, { q: "%" })).rows).toEqual([]);
    expect((await findLeads(db, { q: "_" })).rows).toEqual([]);
  });

  it("filters by status, list, no list and tag", async () => {
    const { dental } = await seed();
    await db.update(leads).set({ status: "interested" }).where(eq(leads.name, "Priya Nair"));

    expect(names(await findLeads(db, { status: "interested" }))).toEqual(["Priya Nair"]);
    expect(names(await findLeads(db, { list: dental.id }))).toEqual(["Priya Nair"]);
    expect(names(await findLeads(db, { list: "none" }))).toEqual(["Rohan Mehta"]);
    expect(names(await findLeads(db, { tag: "saas" }))).toEqual(["Amelia Hart", "Rohan Mehta"]);
    expect(names(await findLeads(db, { tag: "saas", q: "rohan" }))).toEqual(["Rohan Mehta"]);
  });

  it("counts matches and pages through them", async () => {
    await seed();
    const page1 = await findLeads(db, { tag: "saas" }, { pageSize: 1 });
    expect(page1).toMatchObject({ total: 3, matching: 2, page: 1, pageCount: 2 });
    expect(page1.rows).toHaveLength(1);

    const page2 = await findLeads(db, { tag: "saas", page: 2 }, { pageSize: 1 });
    expect(page2.rows).toHaveLength(1);
    expect(page2.rows[0].name).not.toBe(page1.rows[0].name);

    const pastTheEnd = await findLeads(db, { tag: "saas", page: 9 }, { pageSize: 1 });
    expect(pastTheEnd.page).toBe(2);
  });
});

describe("leadTags", () => {
  it("lists every tag in use once, sorted", async () => {
    await add({ tags: ["saas", "warm"] });
    await add({ tags: ["dental", "saas"] });
    expect(await leadTags(db)).toEqual(["dental", "saas", "warm"]);
  });
});
