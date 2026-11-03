import { expect, test } from "@playwright/test";
import { FRIEND_STATE, STRANGER_STATE } from "./auth";

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("app pages send you to sign in, remembering where you were going", async ({ page }) => {
    await page.goto("/leads?status=new");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fleads%3Fstatus%3Dnew$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  test("the home page goes to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("API routes answer 401 instead of redirecting", async ({ request }) => {
    const res = await request.get("/api/export");
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "Sign in to use this API." });
  });

  test("a refused Google account sees why", async ({ page }) => {
    await page.goto("/login?error=AccessDenied");
    // Next's route announcer is also role="alert", so pick ours by its text.
    await expect(page.getByRole("alert").filter({ hasText: "allowed list" })).toContainText("Ask the owner to add it");
  });
});

test.describe("signed in as someone else", () => {
  test.use({ storageState: STRANGER_STATE });

  test("a valid session for another email is still sent to sign in", async ({ page }) => {
    await page.goto("/queue");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fqueue$/);
  });
});

test.describe("signed in as the owner", () => {
  test("the sign-in page sends you to the queue", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/queue$/);
  });

  test("signing out ends the session", async ({ page, isMobile }) => {
    await page.goto("/queue");
    if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/queue");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fqueue$/);
  });
});

test.describe("signed in as a second allowed person", () => {
  test.use({ storageState: FRIEND_STATE });

  test("can use the app and the export, like the owner", async ({ page, request }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/\/leads$/);
    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible();
    expect((await request.get("/api/export?type=leads")).status()).toBe(200);
  });
});
