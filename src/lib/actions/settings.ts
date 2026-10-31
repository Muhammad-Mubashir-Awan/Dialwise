"use server";

import { refresh } from "next/cache";
import { updateSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";
import { parseSettingsForm, type SettingsErrors } from "@/lib/settings-input";

export type SettingsFormState = { errors: SettingsErrors; savedAt?: number };

/** Saves the whole form, or nothing if any field is wrong. */
export async function saveSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireUser();
  const parsed = parseSettingsForm({ ...Object.fromEntries(formData), callDays: formData.getAll("callDays") });
  if (!parsed.ok) return { errors: parsed.errors };
  await updateSettings(getDb(), parsed.values);
  refresh();
  return { errors: {}, savedAt: Date.now() };
}
