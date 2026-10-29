import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { calls, leads, lists, settings } from "@/lib/db/schema";
import { createTestDb, pgErrorCode, resetTestDb, type TestDb } from "../helpers/db";

// Postgres error codes
const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const INVALID_ENUM = "22P02";

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

const newLead = (overrides: Partial<typeof leads.$inferInsert> = {}) => ({
  name: "Amelia Hart",
  phoneE164: "+442079460118",
  phoneRaw: "020 7946 0118",
  ...overrides,
});

describe("leads", () => {
  it("stores a lead with sensible defaults", async () => {
    const [lead] = await db.insert(leads).values(newLead()).returning();

    expect(lead.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(lead.status).toBe("new");
    expect(lead.tags).toEqual([]);
    expect(lead.listId).toBeNull();
    expect(lead.lastCalledAt).toBeNull();
    expect(lead.nextFollowUpAt).toBeNull();
    expect(lead.createdAt).toBeInstanceOf(Date);
  });

  it("keeps tags as a list", async () => {
    const [lead] = await db
      .insert(leads)
      .values(newLead({ tags: ["saas", "warm"] }))
      .returning();
    expect(lead.tags).toEqual(["saas", "warm"]);
  });

  it("rejects a second lead with the same phone number", async () => {
    await db.insert(leads).values(newLead());
    expect(await pgErrorCode(db.insert(leads).values(newLead({ name: "Someone else" })))).toBe(UNIQUE_VIOLATION);
  });

  it("rejects phone numbers that are not in +E.164 form", async () => {
    for (const phoneE164 of ["02079460118", "+0441234567", "+44 20 7946 0118", "+1234567"]) {
      expect(await pgErrorCode(db.insert(leads).values(newLead({ phoneE164 }))), phoneE164).toBe(CHECK_VIOLATION);
    }
  });

  it("accepts a two-letter upper-case country code only", async () => {
    expect(await pgErrorCode(db.insert(leads).values(newLead({ country: "GB" })))).toBeNull();
    expect(await pgErrorCode(db.insert(leads).values(newLead({ phoneE164: "+14155550119", country: "usa" })))).toBe(
      CHECK_VIOLATION,
    );
  });

  it("rejects an unknown status", async () => {
    await db.insert(leads).values(newLead());
    expect(await pgErrorCode(db.execute(sql`update leads set status = 'lost'`))).toBe(INVALID_ENUM);
  });

  it("keeps leads when their list is deleted", async () => {
    const [list] = await db.insert(lists).values({ name: "UK SaaS founders" }).returning();
    const [lead] = await db
      .insert(leads)
      .values(newLead({ listId: list.id }))
      .returning();

    await db.delete(lists).where(eq(lists.id, list.id));

    const [after] = await db.select().from(leads).where(eq(leads.id, lead.id));
    expect(after.listId).toBeNull();
  });
});

describe("calls", () => {
  it("defaults to a manual call with no duration or provider id", async () => {
    const [lead] = await db.insert(leads).values(newLead()).returning();
    const [call] = await db.insert(calls).values({ leadId: lead.id, outcome: "no_answer" }).returning();

    expect(call.channel).toBe("manual");
    expect(call.durationSec).toBeNull();
    expect(call.externalId).toBeNull();
    expect(call.note).toBe("");
    expect(call.calledAt).toBeInstanceOf(Date);
  });

  it("are deleted with their lead", async () => {
    const [lead] = await db.insert(leads).values(newLead()).returning();
    await db.insert(calls).values([
      { leadId: lead.id, outcome: "voicemail" },
      { leadId: lead.id, outcome: "callback", followUpAt: new Date() },
    ]);

    await db.delete(leads).where(eq(leads.id, lead.id));

    expect(await db.select().from(calls)).toHaveLength(0);
  });

  it("rejects a negative duration", async () => {
    const [lead] = await db.insert(leads).values(newLead()).returning();
    expect(
      await pgErrorCode(db.insert(calls).values({ leadId: lead.id, outcome: "interested", durationSec: -5 })),
    ).toBe(CHECK_VIOLATION);
  });
});

describe("settings", () => {
  it("starts with one row of defaults", async () => {
    const rows = await db.select().from(settings);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      callWindowStart: "09:00:00",
      callWindowEnd: "18:00:00",
      callDays: [1, 2, 3, 4, 5],
      retryGapHours: 24,
      defaultCountry: "GB",
    });
  });

  it("allows only one row", async () => {
    expect(await pgErrorCode(db.insert(settings).values({ id: 2 }))).toBe(CHECK_VIOLATION);
  });

  it("requires the call window to start before it ends", async () => {
    expect(await pgErrorCode(db.update(settings).set({ callWindowStart: "18:00", callWindowEnd: "09:00" }))).toBe(
      CHECK_VIOLATION,
    );
  });

  it("keeps the retry gap between 1 and 168 hours and days between 0 and 6", async () => {
    expect(await pgErrorCode(db.update(settings).set({ retryGapHours: 0 }))).toBe(CHECK_VIOLATION);
    expect(await pgErrorCode(db.update(settings).set({ callDays: [1, 7] }))).toBe(CHECK_VIOLATION);
  });
});
