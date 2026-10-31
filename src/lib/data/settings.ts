import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { type Settings, settings } from "@/lib/db/schema";
import type { SettingsValues } from "@/lib/settings-input";

/** The migration's defaults, used if the settings row is ever missing. */
const DEFAULTS: Settings = {
  id: 1,
  callWindowStart: "09:00:00",
  callWindowEnd: "18:00:00",
  callDays: [1, 2, 3, 4, 5],
  retryGapHours: 24,
  defaultCountry: "GB",
  updatedAt: new Date(0),
};

export async function getSettings(db: AppDatabase): Promise<Settings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  return row ?? DEFAULTS;
}

/** Saves the one settings row, putting it back if it's missing. */
export async function updateSettings(db: AppDatabase, values: SettingsValues): Promise<void> {
  await db
    .insert(settings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: settings.id, set: { ...values, updatedAt: new Date() } });
}
