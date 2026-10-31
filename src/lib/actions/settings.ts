"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { updateSettings } from "@/lib/data/settings";
import { getDb } from "@/lib/db/client";
import { requireUser } from "@/lib/session";
import { parseSettingsForm, type SettingsErrors } from "@/lib/settings-input";

/** `version` travels with the state, so each queued save uses the version the one before it left. */
export type SettingsFormState = { errors: SettingsErrors; version: number; savedAt?: number; conflict?: boolean };

const Version = z.number().int().min(0).max(8.64e15);

/** Saves the whole form, or nothing if any field is wrong or someone else has changed the settings meanwhile. */
export async function saveSettings(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireUser();
  const parsed = parseSettingsForm({ ...Object.fromEntries(formData), callDays: formData.getAll("callDays") });
  if (!parsed.ok) return { errors: parsed.errors, version: prev.version };
  const loaded = Version.safeParse(prev.version);
  const version = loaded.success ? await updateSettings(getDb(), parsed.values, loaded.data) : null;
  if (version === null) return { errors: {}, version: prev.version, conflict: true };
  refresh();
  return { errors: {}, version, savedAt: Date.now() };
}
