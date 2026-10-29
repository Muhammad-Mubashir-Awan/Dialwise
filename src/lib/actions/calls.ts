"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type LeadBefore, recordCall, undoCall } from "@/lib/data/calls";
import { getDb } from "@/lib/db/client";
import { CALL_OUTCOMES, type CallOutcome, LEAD_STATUSES } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

const LogCall = z.object({
  leadId: z.uuid(),
  outcome: z.enum(CALL_OUTCOMES),
  note: z.string().trim().max(2000, "Keep the note under 2000 characters.").default(""),
  followUpAt: z.date().nullable().default(null),
});

export type LogCallResult =
  | { ok: true; callId: string; leadId: string; leadName: string; outcome: CallOutcome; before: LeadBefore }
  | { ok: false; error: string };

/** Logs a call outcome for a lead (with an optional note and follow-up time) and refreshes the queue. */
export async function logCallAction(input: unknown): Promise<LogCallResult> {
  await requireUser();
  const parsed = LogCall.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { leadId, outcome, note, followUpAt } = parsed.data;

  const result = await recordCall(getDb(), { leadId, outcome, note, followUpAt, now: new Date() });
  if (!result.ok) return result;
  refresh();
  return { ok: true, callId: result.callId, leadId, leadName: result.leadName, outcome, before: result.before };
}

const UndoCall = z.object({
  callId: z.uuid(),
  before: z.object({
    status: z.enum(LEAD_STATUSES),
    lastCalledAt: z.date().nullable(),
    nextFollowUpAt: z.date().nullable(),
  }),
});

/** Takes back the call just logged and puts the lead back as it was. */
export async function undoCallAction(
  input: unknown,
): Promise<{ ok: true; leadId: string; leadName: string } | { ok: false; error: string }> {
  await requireUser();
  const parsed = UndoCall.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That call can't be undone." };
  const result = await undoCall(getDb(), { ...parsed.data, now: new Date() });
  if (result.ok) refresh();
  return result;
}
