import { expect, test } from "@playwright/test";
import { open } from "./app";

test("opening the app lands on the queue", async ({ page }) => {
  await open(page, "/");
  await expect(page).toHaveURL(/\/queue$/);
  await expect(page.getByRole("heading", { level: 1, name: "Queue" })).toBeVisible();
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop sidebar only");

  test("sidebar links navigate and mark the current page", async ({ page }) => {
    await open(page, "/queue");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Leads" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Leads" })).toHaveAttribute("aria-current", "page");
  });

  test("G then a letter jumps between pages", async ({ page }) => {
    await open(page, "/queue");
    await page.keyboard.press("g");
    await page.keyboard.press("s");
    await expect(page).toHaveURL(/\/stats$/);
    await page.keyboard.press("g");
    await page.keyboard.press("f");
    await expect(page).toHaveURL(/\/follow-ups$/);
  });

  test("Ctrl+K opens the command menu and runs a command", async ({ page }) => {
    await open(page, "/queue");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.type("import");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/import$/);
    await expect(dialog).toBeHidden();
  });

  test("? shows the keyboard shortcuts", async ({ page }) => {
    await open(page, "/queue");
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  });

  test("theme switcher cycles system, light and dark", async ({ page }) => {
    await open(page, "/queue");
    const toggle = page.getByRole("button", { name: /^Theme:/ });
    await expect(toggle).toHaveText("Theme: System");
    await toggle.click();
    await expect(toggle).toHaveText("Theme: Light");
    await expect(page.locator("html")).toHaveClass(/light/);
    await toggle.click();
    await expect(toggle).toHaveText("Theme: Dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "phone layout only");

  test("menu button opens navigation", async ({ page }) => {
    await open(page, "/queue");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Follow-ups" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Follow-ups" })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("pages never scroll sideways", async ({ page }) => {
    for (const path of ["/queue", "/leads", "/lists", "/stats", "/login"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
