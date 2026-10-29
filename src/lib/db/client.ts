import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.");
  }
  return drizzle({ client: neon(url), schema });
}

let db: ReturnType<typeof createDb> | undefined;

/** The app's database (Neon over HTTP). Created on first use, so builds don't need DATABASE_URL. */
export function getDb() {
  return (db ??= createDb());
}

/** Any Drizzle Postgres database with this schema: Neon in the app, PGlite in tests. */
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
