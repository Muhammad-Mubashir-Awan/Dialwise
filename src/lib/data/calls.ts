/** Logging calls. Each write is one transaction: the call and the lead's new status and times change together. */
import { desc, eq, gte } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { type CallOutcome, calls, type LeadStatus, leads } from "@/lib/db/schema";
import { needsFollowUp, nextStatus } from "@/lib/outcomes";

/** The lead's fields that a call changes, as they were before it: what Undo puts back. */
export type LeadBefore = { status: LeadStatus; lastCalledAt: Date | null; nextFollowUpAt: Date | null };

export type RecordCallInput = {
  leadId: string;
  outcome: CallOutcome;
  note: string;
  /** The follow-up (or meeting) time for outcomes that need one; ignored for the others. */
  followUpAt: Date | null;
  now: Date;
};

export type RecordCallResult =
  { ok: true; callId: string; leadName: string; before: LeadBefore } | { ok: false; error: string };

const UNDO_WINDOW_MS = 15 * 60_000;

export async function recordCall(db: AppDatabase, input: RecordCallInput): Promise<RecordCallResult> {
  const followUpAt = needsFollowUp(input.outcome) ? input.followUpAt : null;
  if (needsFollowUp(input.outcome)) {
    const meeting = input.outcome === "meeting_booked";
    if (!followUpAt) return { ok: false, error: meeting ? "Pick the meeting time." : "Pick when to follow up." };
    if (followUpAt <= input.now) {
      return {
        ok: false,
        error: meeting ? "Pick a meeting time in the future." : "Pick a follow-up time in the future.",
      };
    }
  }

  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select({
        name: leads.name,
        status: leads.status,
        lastCalledAt: leads.lastCalledAt,
        nextFollowUpAt: leads.nextFollowUpAt,
      })
      .from(leads)
      .where(eq(leads.id, input.leadId))
      .for("update");
    if (!lead) return { ok: false, error: "This lead was deleted." };

    const [call] = await tx
      .insert(calls)
      .values({ leadId: input.leadId, outcome: input.outcome, note: input.note, followUpAt, calledAt: input.now })
      .returning({ id: calls.id });
    await tx
      .update(leads)
      .set({ status: nextStatus(lead.status, input.outcome), lastCalledAt: input.now, nextFollowUpAt: followUpAt })
      .where(eq(leads.id, input.leadId));

    const { name, ...before } = lead;
    return { ok: true, callId: call.id, leadName: name, before };
  });
}

export type UndoCallResult = { ok: true; leadId: string; leadName: string } | { ok: false; error: string };

/** Removes a just-logged call and restores the lead. Only the lead's latest call, within 15 minutes. */
export async function undoCall(
  db: AppDatabase,
  { callId, before, now }: { callId: string; before: LeadBefore; now: Date },
): Promise<UndoCallResult> {
  return db.transaction(async (tx) => {
    const [call] = await tx
      .select({ leadId: calls.leadId, calledAt: calls.calledAt })
      .from(calls)
      .where(eq(calls.id, callId));
    if (!call) return { ok: false, error: "That call was already removed." };
    const [lead] = await tx.select({ name: leads.name }).from(leads).where(eq(leads.id, call.leadId)).for("update");
    const [latest] = await tx
      .select({ id: calls.id })
      .from(calls)
      .where(eq(calls.leadId, call.leadId))
      .orderBy(desc(calls.calledAt))
      .limit(1);
    if (latest?.id !== callId) return { ok: false, error: "Only the most recent call can be undone." };
    if (now.getTime() - call.calledAt.getTime() > UNDO_WINDOW_MS) {
      return { ok: false, error: "It's too late to undo this call." };
    }

    await tx.delete(calls).where(eq(calls.id, callId));
    await tx.update(leads).set(before).where(eq(leads.id, call.leadId));
    return { ok: true, leadId: call.leadId, leadName: lead.name };
  });
}

/** Calls logged since `since`, for the "Today" summary (the browser decides where today starts). */
export async function callsSince(db: AppDatabase, since: Date): Promise<{ calledAt: Date; outcome: CallOutcome }[]> {
  return db
    .select({ calledAt: calls.calledAt, outcome: calls.outcome })
    .from(calls)
    .where(gte(calls.calledAt, since))
    .orderBy(desc(calls.calledAt));
}
