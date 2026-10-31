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

const version = async () => (await getSettings(db)).updatedAt.getTime();

describe("updateSettings", () => {
  it("saves every setting", async () => {
    await updateSettings(db, VALUES, await version());
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
    await updateSettings(db, VALUES, await version());
    const after = await getSettings(db);
    expect(after.updatedAt.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());
    expect(after.id).toBe(before.id);
  });

  it("puts the row back if it's missing", async () => {
    await db.execute(sql`delete from settings`);
    await updateSettings(db, VALUES, 0);
    const rows = await db.select().from(settings);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, retryGapHours: 48 });
  });

  it("saves over the row as first created, whose time has more digits than a browser can hold", async () => {
    await db.execute(sql`update settings set updated_at = '2026-01-01 12:00:00.123456+00'`);
    expect(await updateSettings(db, VALUES, await version())).toEqual(expect.any(Number));
    expect(await getSettings(db)).toMatchObject({ retryGapHours: 48 });
  });

  it("returns the new version, which the next save can use", async () => {
    const next = await updateSettings(db, VALUES, await version());
    expect(next).toBe(await version());
    expect(await updateSettings(db, { ...VALUES, retryGapHours: 72 }, next!)).toEqual(expect.any(Number));
    expect(await getSettings(db)).toMatchObject({ retryGapHours: 72 });
  });

  it("refuses to save over a change made since the page loaded", async () => {
    const stale = await version();
    await db.execute(sql`update settings set retry_gap_hours = 12, updated_at = now() + interval '1 second'`);
    expect(await updateSettings(db, VALUES, stale)).toBeNull();
    expect(await getSettings(db)).toMatchObject({ retryGapHours: 12, defaultCountry: "GB" });
  });
});
