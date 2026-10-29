import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { callsSince, recordCall, undoCall } from "@/lib/data/calls";
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

async function addLead(fields: { status?: LeadStatus; nextFollowUpAt?: Date; lastCalledAt?: Date } = {}) {
  const [lead] = await db
    .insert(leads)
    .values({ name: "Amelia Hart", phoneE164: "+442079460118", phoneRaw: "x", ...fields })
    .returning();
  return lead.id;
}
const lead = async (id: string) => (await db.select().from(leads).where(eq(leads.id, id)))[0];

describe("recordCall", () => {
  it("saves the call and updates the lead's status and last call time", async () => {
    const id = await addLead();
    const result = await recordCall(db, {
      leadId: id,
      outcome: "no_answer",
      note: "Rang out",
      followUpAt: null,
      now: NOW,
    });

    expect(result).toMatchObject({ ok: true, leadName: "Amelia Hart" });
    const [call] = await db.select().from(calls);
    expect(call).toMatchObject({
      leadId: id,
      outcome: "no_answer",
      note: "Rang out",
      calledAt: NOW,
      channel: "manual",
    });
    expect(await lead(id)).toMatchObject({ status: "contacted", lastCalledAt: NOW, nextFollowUpAt: null });
  });

  it("sets the follow-up for callback, interested and a booked meeting", async () => {
    const id = await addLead();
    await recordCall(db, { leadId: id, outcome: "callback", note: "", followUpAt: later(20), now: NOW });
    expect(await lead(id)).toMatchObject({ status: "callback", nextFollowUpAt: later(20) });
    expect((await db.select().from(calls))[0].followUpAt).toEqual(later(20));

    await recordCall(db, { leadId: id, outcome: "meeting_booked", note: "", followUpAt: later(48), now: later(1) });
    expect(await lead(id)).toMatchObject({ status: "meeting_booked", nextFollowUpAt: later(48) });
  });

  it("clears an old follow-up when the new outcome doesn't need one", async () => {
    const id = await addLead({ status: "callback", nextFollowUpAt: later(-1) });
    await recordCall(db, { leadId: id, outcome: "voicemail", note: "", followUpAt: later(5), now: NOW });
    expect(await lead(id)).toMatchObject({ status: "callback", nextFollowUpAt: null });
    expect((await db.select().from(calls))[0].followUpAt).toBeNull();
  });

  it("needs a follow-up time in the future for outcomes that use one", async () => {
    const id = await addLead();
    expect(await recordCall(db, { leadId: id, outcome: "interested", note: "", followUpAt: null, now: NOW })).toEqual({
      ok: false,
      error: "Pick when to follow up.",
    });
    expect(
      await recordCall(db, { leadId: id, outcome: "meeting_booked", note: "", followUpAt: later(-1), now: NOW }),
    ).toEqual({ ok: false, error: "Pick a meeting time in the future." });
    expect(await db.select().from(calls)).toEqual([]);
  });

  it("keeps do not call permanent", async () => {
    const id = await addLead({ status: "do_not_call" });
    await recordCall(db, { leadId: id, outcome: "interested", note: "", followUpAt: later(2), now: NOW });
    expect((await lead(id)).status).toBe("do_not_call");
  });

  it("reports a lead that was deleted", async () => {
    expect(
      await recordCall(db, {
        leadId: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60",
        outcome: "no_answer",
        note: "",
        followUpAt: null,
        now: NOW,
      }),
    ).toEqual({ ok: false, error: "This lead was deleted." });
  });

  it("saves nothing if the lead update fails: the call and the lead change are one transaction", async () => {
    const id = await addLead();
    await db.execute(sql`create function fail_lead_update() returns trigger language plpgsql as $$
      begin raise exception 'lead update failed on purpose'; end $$`);
    await db.execute(
      sql`create trigger fail_lead_update before update on leads for each row execute function fail_lead_update()`,
    );
    try {
      await expect(
        recordCall(db, { leadId: id, outcome: "no_answer", note: "", followUpAt: null, now: NOW }),
      ).rejects.toThrow();
      expect(await db.select().from(calls)).toEqual([]);
    } finally {
      await db.execute(sql`drop trigger fail_lead_update on leads`);
      await db.execute(sql`drop function fail_lead_update()`);
    }
  });
});

describe("undoCall", () => {
  it("removes the call and puts the lead back as it was", async () => {
    const id = await addLead({ status: "callback", nextFollowUpAt: later(-2), lastCalledAt: later(-30) });
    const logged = await recordCall(db, {
      leadId: id,
      outcome: "not_interested",
      note: "",
      followUpAt: null,
      now: NOW,
    });
    if (!logged.ok) throw new Error(logged.error);

    expect(await undoCall(db, { callId: logged.callId, before: logged.before, now: later(0.05) })).toEqual({
      ok: true,
      leadId: id,
      leadName: "Amelia Hart",
    });
    expect(await db.select().from(calls)).toEqual([]);
    expect(await lead(id)).toMatchObject({ status: "callback", nextFollowUpAt: later(-2), lastCalledAt: later(-30) });
  });

  it("only undoes the lead's most recent call", async () => {
    const id = await addLead();
    const first = await recordCall(db, { leadId: id, outcome: "no_answer", note: "", followUpAt: null, now: NOW });
    await recordCall(db, { leadId: id, outcome: "gatekeeper", note: "", followUpAt: null, now: later(0.01) });
    if (!first.ok) throw new Error(first.error);
    expect(await undoCall(db, { callId: first.callId, before: first.before, now: later(0.02) })).toEqual({
      ok: false,
      error: "Only the most recent call can be undone.",
    });
  });

  it("refuses after 15 minutes, and for a call that's gone", async () => {
    const id = await addLead();
    const logged = await recordCall(db, { leadId: id, outcome: "no_answer", note: "", followUpAt: null, now: NOW });
    if (!logged.ok) throw new Error(logged.error);
    expect(await undoCall(db, { callId: logged.callId, before: logged.before, now: later(0.26) })).toEqual({
      ok: false,
      error: "It's too late to undo this call.",
    });
    expect(
      await undoCall(db, { callId: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60", before: logged.before, now: NOW }),
    ).toEqual({ ok: false, error: "That call was already removed." });
  });
});

describe("callsSince", () => {
  it("lists calls logged since a time, newest first", async () => {
    const id = await addLead();
    await recordCall(db, { leadId: id, outcome: "no_answer", note: "", followUpAt: null, now: later(-30) });
    await recordCall(db, { leadId: id, outcome: "gatekeeper", note: "", followUpAt: null, now: later(-2) });
    await recordCall(db, { leadId: id, outcome: "callback", note: "", followUpAt: later(5), now: later(-1) });
    expect(await callsSince(db, later(-24))).toEqual([
      { calledAt: later(-1), outcome: "callback" },
      { calledAt: later(-2), outcome: "gatekeeper" },
    ]);
  });
});
