import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { calls, leads, lists } from "@/lib/db/schema";
import { createTestDb, resetTestDb, type TestDb } from "../helpers/db";

// The actions use the app's database and session; point them at PGlite and a switchable sign-in.
const mocks = vi.hoisted(() => ({
  db: undefined as unknown as TestDb,
  signedIn: true,
  refresh: vi.fn(),
}));
vi.mock("@/lib/db/client", () => ({ getDb: () => mocks.db }));
vi.mock("next/cache", () => ({ refresh: mocks.refresh }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => {
    // The real requireUser redirects, which throws inside an action.
    if (!mocks.signedIn) throw new Error("NEXT_REDIRECT;/login");
    return { email: "owner@example.test", name: "Owner", image: null };
  },
}));

const { deleteLeadAction, saveLead } = await import("@/lib/actions/leads");
const { deleteListAction, saveList } = await import("@/lib/actions/lists");
const { logCallAction, undoCallAction } = await import("@/lib/actions/calls");
const { checkImportPhones, importBatchAction } = await import("@/lib/actions/import");

let close: () => Promise<void>;

beforeAll(async () => {
  ({ db: mocks.db, close } = await createTestDb());
});
beforeEach(async () => {
  await resetTestDb(mocks.db);
  mocks.signedIn = true;
  mocks.refresh.mockClear();
});
afterAll(async () => {
  await close();
});

const formData = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const initial = { errors: {}, submittedAt: 0 };
const leadForm = (fields: Record<string, string> = {}) =>
  formData({ name: "Amelia Hart", phone: "020 7946 0118", country: "GB", ...fields });

describe("saveLead", () => {
  it("adds a lead from the form and refreshes the page", async () => {
    const state = await saveLead(initial, leadForm({ tags: "SaaS, warm" }));

    const [lead] = await mocks.db.select().from(leads);
    expect(state.saved).toEqual({ id: lead.id, name: "Amelia Hart", created: true });
    expect(lead).toMatchObject({
      phoneE164: "+442079460118",
      country: "GB",
      timezone: "Europe/London",
      tags: ["saas", "warm"],
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("updates the lead named by the form's id", async () => {
    const created = await saveLead(initial, leadForm());
    const id = created.saved!.id;

    const state = await saveLead(initial, leadForm({ id, name: "Amelia Hart-Jones" }));

    expect(state.saved).toEqual({ id, name: "Amelia Hart-Jones", created: false });
    expect(await mocks.db.select({ name: leads.name }).from(leads)).toEqual([{ name: "Amelia Hart-Jones" }]);
  });

  it("returns field errors without saving or refreshing", async () => {
    const state = await saveLead(initial, leadForm({ name: "", phone: "12" }));

    expect(Object.keys(state.errors).sort()).toEqual(["name", "phone"]);
    expect(await mocks.db.select().from(leads)).toEqual([]);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("says when the lead being edited was deleted meanwhile", async () => {
    const state = await saveLead(initial, leadForm({ id: "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60" }));
    expect(state.formError).toBe("This lead was deleted, so the changes weren't saved.");
  });

  it("saves nothing when nobody is signed in", async () => {
    mocks.signedIn = false;
    await expect(saveLead(initial, leadForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(leads)).toEqual([]);
  });
});

describe("deleteLeadAction", () => {
  it("deletes the lead and its calls", async () => {
    const id = (await saveLead(initial, leadForm())).saved!.id;
    await mocks.db.insert(calls).values({ leadId: id, outcome: "no_answer" });

    expect(await deleteLeadAction(id)).toEqual({ ok: true, name: "Amelia Hart" });
    expect(await mocks.db.select().from(calls)).toEqual([]);
  });

  it("says when the lead was already deleted", async () => {
    expect(await deleteLeadAction("6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60")).toEqual({
      ok: false,
      error: "This lead was already deleted.",
    });
  });

  it("deletes nothing when nobody is signed in", async () => {
    const id = (await saveLead(initial, leadForm())).saved!.id;
    mocks.signedIn = false;
    await expect(deleteLeadAction(id)).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(leads)).toHaveLength(1);
  });
});

describe("list actions", () => {
  it("creates, renames and deletes a list", async () => {
    expect(await saveList({ submittedAt: 0 }, formData({ name: " Dental clinics " }))).toMatchObject({
      savedName: "Dental clinics",
    });
    const [list] = await mocks.db.select().from(lists);

    expect(await saveList({ submittedAt: 0 }, formData({ id: list.id, name: "Dentists" }))).toMatchObject({
      savedName: "Dentists",
    });
    expect(await deleteListAction(list.id)).toEqual({ ok: true, name: "Dentists" });
    expect(await mocks.db.select().from(lists)).toEqual([]);
    expect(mocks.refresh).toHaveBeenCalledTimes(3);
  });

  it("returns the problem with a name", async () => {
    expect(await saveList({ submittedAt: 0 }, formData({ name: "  " }))).toMatchObject({
      error: "Enter a name for the list.",
    });
  });

  it("creates nothing when nobody is signed in", async () => {
    mocks.signedIn = false;
    await expect(saveList({ submittedAt: 0 }, formData({ name: "Dental clinics" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(lists)).toEqual([]);
  });

  it("deletes nothing when nobody is signed in", async () => {
    await saveList({ submittedAt: 0 }, formData({ name: "Dental clinics" }));
    const [list] = await mocks.db.select().from(lists);
    mocks.signedIn = false;
    await expect(deleteListAction(list.id)).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(lists)).toHaveLength(1);
  });
});

describe("call actions", () => {
  const addLead = async () => (await saveLead(initial, leadForm())).saved!.id;
  const inHours = (h: number) => new Date(Date.now() + h * 3_600_000);

  it("logs a call, refreshes the queue, and can undo it", async () => {
    const leadId = await addLead();
    mocks.refresh.mockClear();

    const logged = await logCallAction({
      leadId,
      outcome: "callback",
      note: " Call after lunch ",
      followUpAt: inHours(3),
    });
    expect(logged).toMatchObject({ ok: true, leadId, leadName: "Amelia Hart", outcome: "callback" });
    const [call] = await mocks.db.select().from(calls);
    expect(call).toMatchObject({ outcome: "callback", note: "Call after lunch" });
    expect(mocks.refresh).toHaveBeenCalledOnce();

    if (!logged.ok) throw new Error(logged.error);
    expect(await undoCallAction({ callId: logged.callId, before: logged.before })).toEqual({
      ok: true,
      leadId,
      leadName: "Amelia Hart",
    });
    expect(await mocks.db.select().from(calls)).toEqual([]);
    const [lead] = await mocks.db.select().from(leads);
    expect(lead).toMatchObject({ status: "new", nextFollowUpAt: null, lastCalledAt: null });
  });

  it("explains a missing follow-up time and rejects bad input", async () => {
    const leadId = await addLead();
    expect(await logCallAction({ leadId, outcome: "interested" })).toEqual({
      ok: false,
      error: "Pick when to follow up.",
    });
    expect((await logCallAction({ leadId, outcome: "shouted" })).ok).toBe(false);
    expect((await logCallAction({ leadId: "nope", outcome: "no_answer" })).ok).toBe(false);
    expect(await mocks.db.select().from(calls)).toEqual([]);
  });

  it("logs nothing and undoes nothing when nobody is signed in", async () => {
    const leadId = await addLead();
    const logged = await logCallAction({ leadId, outcome: "no_answer" });
    mocks.signedIn = false;
    await expect(logCallAction({ leadId, outcome: "no_answer" })).rejects.toThrow("NEXT_REDIRECT");
    if (!logged.ok) throw new Error(logged.error);
    await expect(undoCallAction({ callId: logged.callId, before: logged.before })).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(calls)).toHaveLength(1);
  });
});

describe("import actions", () => {
  const raw = (phone: string, name: string) => ({
    name,
    company: "",
    role: "",
    phone,
    email: "",
    website: "",
    country: "",
    tags: "",
    notes: "",
  });
  const batch = (rows: ReturnType<typeof raw>[]) => ({
    listId: null,
    defaultCountry: "GB",
    fileName: "leads.csv",
    rows,
  });

  it("imports a batch, checking every row again, and reports what happened", async () => {
    await saveLead(initial, leadForm({ phone: "020 7946 0118" }));
    const result = await importBatchAction(
      batch([raw("020 7946 0001", "New one"), raw("020 7946 0118", "Duplicate"), raw("n/a", "No phone")]),
    );
    expect(result).toEqual({ ok: true, added: 1, duplicates: 1, doNotCall: 0, invalid: 1 });
    const [lead] = await mocks.db.select().from(leads).where(eq(leads.name, "New one"));
    expect(lead.source).toBe("Import: leads.csv");
  });

  it("checks which numbers are already in the CRM", async () => {
    await saveLead(initial, leadForm({ phone: "020 7946 0118" }));
    expect(await checkImportPhones(["+442079460118", "+442079460001"])).toEqual({ existing: 1, doNotCall: 0 });
    expect(await checkImportPhones(["not a number"])).toBeNull();
  });

  it("rejects batches it can't read", async () => {
    expect((await importBatchAction({ ...batch([]), defaultCountry: "gb" })).ok).toBe(false);
    expect((await importBatchAction(batch(Array.from({ length: 501 }, (_, i) => raw(String(i), "x"))))).ok).toBe(false);
  });

  it("imports and checks nothing when nobody is signed in", async () => {
    mocks.signedIn = false;
    await expect(importBatchAction(batch([raw("020 7946 0001", "New one")]))).rejects.toThrow("NEXT_REDIRECT");
    await expect(checkImportPhones(["+442079460118"])).rejects.toThrow("NEXT_REDIRECT");
    expect(await mocks.db.select().from(leads)).toEqual([]);
  });
});
