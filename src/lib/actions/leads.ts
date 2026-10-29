"use server";

import { refresh } from "next/cache";
import { createLead, deleteLead, updateLead } from "@/lib/data/leads";
import { getDb } from "@/lib/db/client";
import { type LeadErrors, parseLeadForm } from "@/lib/lead-input";
import { requireUser } from "@/lib/session";

export type LeadFormState = {
  errors: LeadErrors;
  /** A problem that isn't about one field. */
  formError?: string;
  saved?: { id: string; name: string; created: boolean };
  /** Bumped on every submit, so the form can tell a new result from the previous one. */
  submittedAt: number;
};

/** Creates a lead, or updates one when the form has an `id`. */
export async function saveLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  await requireUser();
  const submittedAt = Date.now();
  const id = formData.get("id");
  const parsed = parseLeadForm(Object.fromEntries(formData));
  if (!parsed.ok) return { errors: parsed.errors, submittedAt };

  const db = getDb();
  const editing = typeof id === "string" && id !== "";
  const result = editing ? await updateLead(db, id, parsed.values) : await createLead(db, parsed.values);
  if (!result.ok) {
    const formError = result.notFound ? "This lead was deleted, so the changes weren't saved." : undefined;
    return { errors: result.errors, formError, submittedAt };
  }
  refresh();
  return { errors: {}, saved: { id: result.id, name: result.name, created: !editing }, submittedAt };
}

/** Deletes a lead and its call history. */
export async function deleteLeadAction(id: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  await requireUser();
  const name = await deleteLead(getDb(), id);
  return name ? { ok: true, name } : { ok: false, error: "This lead was already deleted." };
}
