// The e2e test server's database: an in-memory Postgres (PGlite) with the app's migrations, reachable over TCP.
// Playwright starts it next to the app (see playwright.config.ts); nothing is written to disk.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const port = Number(process.env.E2E_DB_PORT);
const db = await PGlite.create();
await migrate(drizzle({ client: db }), { migrationsFolder: "drizzle" });

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`E2E database listening on 127.0.0.1:${port}`);

async function stop() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
