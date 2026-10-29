import { defineConfig, devices } from "@playwright/test";
import { E2E_SERVER_ENV, OWNER_STATE } from "./e2e/auth";

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
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    env: E2E_SERVER_ENV,
    // Always start fresh: a leftover server can serve an older build than the one just made.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
