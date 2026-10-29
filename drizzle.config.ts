import { defineConfig } from "drizzle-kit";

// `generate` needs no database; `migrate` and `studio` read DATABASE_URL from .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: fine for `generate`, and in CI the variable comes from the environment.
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
