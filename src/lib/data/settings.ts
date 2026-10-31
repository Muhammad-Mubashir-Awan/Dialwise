import { eq, sql } from "drizzle-orm";
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

/**
 * Saves the one settings row, putting it back if it's missing. `version` is the row's `updatedAt` in milliseconds
 * when the page read it: if the row has changed since, nothing is saved and this returns null, so one person's page
 * can't quietly undo another's change. Otherwise it returns the new version.
 */
export async function updateSettings(db: AppDatabase, values: SettingsValues, version: number): Promise<number | null> {
  const updatedAt = new Date();
  const saved = await db
    .insert(settings)
    .values({ id: 1, ...values, updatedAt })
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...values, updatedAt },
      // The column holds microseconds and the page only knows milliseconds.
      setWhere: sql`date_trunc('milliseconds', ${settings.updatedAt}) = ${new Date(version).toISOString()}::timestamptz`,
    })
    .returning({ id: settings.id });
  return saved.length ? updatedAt.getTime() : null;
}
