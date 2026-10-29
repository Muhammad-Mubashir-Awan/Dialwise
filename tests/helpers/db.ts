import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

/** A fresh in-memory Postgres with the real migrations applied. */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });
  return { db, close: () => client.close() };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];

/** Empties every table and restores the default settings row, so each test starts clean. */
export async function resetTestDb(db: TestDb) {
  await db.execute(sql`truncate table calls, leads, lists cascade`);
  await db.execute(sql`delete from settings`);
  await db.execute(sql`insert into settings (id) values (1)`);
}

/** The Postgres error code (e.g. 23505) behind a rejected query, or null if it succeeded. */
export async function pgErrorCode(query: PromiseLike<unknown>): Promise<string | null> {
  try {
    await query;
    return null;
  } catch (error) {
    const err = error as { code?: string; cause?: { code?: string } };
    return err.cause?.code ?? err.code ?? "unknown";
  }
}
