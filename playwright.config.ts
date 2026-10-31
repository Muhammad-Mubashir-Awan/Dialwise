import { defineConfig, devices } from "@playwright/test";
import { E2E_SERVER_ENV, OWNER_STATE } from "./e2e/auth";
import { E2E_DATABASE_URL, E2E_DB_PORT } from "./e2e/db";

const PORT = 3100;

// Runs against a production build: `npm run test:e2e` builds first.
// Tests are signed in as the owner unless they set their own storageState.
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    storageState: OWNER_STATE,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", testIgnore: "settings.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: "settings.spec.ts", use: { ...devices["Pixel 7"] } },
    // Saved settings change what every other test sees, so these run one at a time, after all the others.
    {
      name: "settings",
      testMatch: "settings.spec.ts",
      dependencies: ["desktop", "mobile"],
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // An in-memory Postgres with the app's migrations, so tests never touch a real database.
      command: "node e2e/db-server.mts",
      port: E2E_DB_PORT,
      env: { E2E_DB_PORT: String(E2E_DB_PORT) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      // Set here, DATABASE_URL wins over any value in .env.local. One connection: the test database has one
      // Postgres session, so transactions from parallel requests must not interleave.
      env: { ...E2E_SERVER_ENV, DATABASE_URL: E2E_DATABASE_URL, DATABASE_POOL_MAX: "1" },
      // Always start fresh: a leftover server can serve an older build than the one just made.
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
