import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getSettings, updateSettings } from "@/lib/data/settings";
import { settings } from "@/lib/db/schema";
import type { SettingsValues } from "@/lib/settings-input";
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

const VALUES: SettingsValues = {
  callWindowStart: "08:30",
  callWindowEnd: "17:00",
  callDays: [0, 6],
  retryGapHours: 48,
  defaultCountry: "US",
};

describe("updateSettings", () => {
  it("saves every setting", async () => {
    await updateSettings(db, VALUES);
    expect(await getSettings(db)).toMatchObject({
      callWindowStart: "08:30:00",
      callWindowEnd: "17:00:00",
      callDays: [0, 6],
      retryGapHours: 48,
      defaultCountry: "US",
    });
  });

  it("stamps the time of the change", async () => {
    const before = await getSettings(db);
    await db.execute(sql`update settings set updated_at = '2020-01-01'`);
    await updateSettings(db, VALUES);
    const after = await getSettings(db);
    expect(after.updatedAt.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());
    expect(after.id).toBe(before.id);
  });

  it("puts the row back if it's missing", async () => {
    await db.execute(sql`delete from settings`);
    await updateSettings(db, VALUES);
    const rows = await db.select().from(settings);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, retryGapHours: 48 });
  });
});
