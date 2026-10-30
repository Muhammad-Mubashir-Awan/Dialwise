import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.");
  }
  // A small pool: one person uses the app, and Neon's pooled connection string does the heavy pooling.
  // DATABASE_POOL_MAX=1 is used by the e2e server, whose in-memory database has a single session.
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX) || 3,
    idleTimeoutMillis: 5_000,
    // Neon's connection strings ask for channel binding; node-postgres only does it when told to (and only
    // when the server offers it, so the e2e test database is unaffected).
    enableChannelBinding: true,
  });
  return drizzle({ client: pool, schema });
}

let db: ReturnType<typeof createDb> | undefined;

/** The app's database (Postgres over TCP with node-postgres). Created on first use, so builds don't need DATABASE_URL. */
export function getDb() {
  return (db ??= createDb());
}

/** Any Drizzle Postgres database with this schema: Neon in the app, PGlite in tests. */
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
