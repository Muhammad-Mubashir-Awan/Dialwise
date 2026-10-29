"use server";

import { refresh } from "next/cache";
import { createList, deleteList, renameList } from "@/lib/data/lists";
import { getDb } from "@/lib/db/client";
import { parseListName } from "@/lib/lead-input";
import { requireUser } from "@/lib/session";

export type ListFormState = { error?: string; savedName?: string; submittedAt: number };

/** Creates a list, or renames one when the form has an `id`. */
export async function saveList(_prev: ListFormState, formData: FormData): Promise<ListFormState> {
  await requireUser();
  const submittedAt = Date.now();
  const parsed = parseListName(formData.get("name"));
  if (!parsed.ok) return { error: parsed.error, submittedAt };

  const id = formData.get("id");
  const db = getDb();
  const result =
    typeof id === "string" && id !== "" ? await renameList(db, id, parsed.name) : await createList(db, parsed.name);
  if (!result.ok) return { error: result.error, submittedAt };
  refresh();
  return { savedName: parsed.name, submittedAt };
}

/** Deletes a list; its leads stay, with no list. */
export async function deleteListAction(id: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  await requireUser();
  const name = await deleteList(getDb(), id);
  if (!name) return { ok: false, error: "This list was already deleted." };
  refresh();
  return { ok: true, name };
}
