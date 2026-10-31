import { expect, type Page, test } from "@playwright/test";
import { open } from "./app";
import { resetSettings, seedLead, unique } from "./db";

test.afterEach(async () => {
  await resetSettings();
});

/** Opens Settings and waits until the form can save, so typing isn't lost to a page still loading. */
async function openSettings(page: Page) {
  await open(page, "/settings");
  await formReady(page);
}

/** The form saves from an effect, so wait for that before typing or reading values back. */
const formReady = (page: Page) => expect(page.locator("form[data-ready='true']")).toBeVisible();

const status = (page: Page) => page.getByRole("main").getByRole("status");
const day = (page: Page, name: string) => page.getByRole("checkbox", { name });
const from = (page: Page) => page.getByLabel("From (their time)");
const until = (page: Page) => page.getByLabel("Until (their time)");
const retryGap = (page: Page) => page.getByLabel("Wait after no answer or voicemail");
const country = (page: Page) => page.getByLabel("Default country");

test("shows the current settings", async ({ page }) => {
  await openSettings(page);
  await expect(from(page)).toHaveValue("09:00");
  await expect(until(page)).toHaveValue("18:00");
  await expect(day(page, "Mon")).toBeChecked();
  await expect(day(page, "Sat")).not.toBeChecked();
  await expect(retryGap(page)).toHaveValue("24");
  await expect(country(page)).toHaveValue("GB");
  await expect(status(page)).toHaveText("Changes save as you make them.");
});

test("changes save as you make them and are still there after a reload", async ({ page }) => {
  await openSettings(page);
  await from(page).fill("08:30");
  await until(page).fill("17:00");
  await day(page, "Sat").check();
  await day(page, "Mon").uncheck();
  await retryGap(page).fill("48");
  await country(page).selectOption("US");
  await expect(status(page)).toHaveText(/^Saved at /);

  await page.reload();
  await formReady(page);
  await expect(from(page)).toHaveValue("08:30");
  await expect(until(page)).toHaveValue("17:00");
  await expect(day(page, "Sat")).toBeChecked();
  await expect(day(page, "Mon")).not.toBeChecked();
  await expect(retryGap(page)).toHaveValue("48");
  await expect(country(page)).toHaveValue("US");
});

test("leaving a field without changing it doesn't save", async ({ page }) => {
  await openSettings(page);
  await retryGap(page).focus();
  await retryGap(page).blur();
  await expect(status(page)).toHaveText("Changes save as you make them.");
});

test("the queue and the lead form follow the settings", async ({ page }) => {
  await seedLead({ name: `Waiting ${unique()}` });
  await openSettings(page);
  await retryGap(page).fill("48");
  await country(page).selectOption("US");
  await expect(status(page)).toHaveText(/^Saved at /);

  await open(page, "/queue");
  await expect(page.getByLabel("Queue summary")).toContainText("waiting for retry (48h after no answer)");

  await open(page, "/leads");
  await expect(page.locator("html")).toHaveAttribute("data-lead-shortcut", "a");
  await page.keyboard.press("a");
  await expect(page.getByRole("dialog", { name: "Add lead" }).getByLabel("Country")).toHaveValue("US");
});

test("a wrong value says why and saves nothing", async ({ page }) => {
  await openSettings(page);
  await until(page).fill("08:00");
  await until(page).blur();
  await expect(page.getByText("Must be later than the start time.")).toBeVisible();
  await expect(status(page)).toHaveText(/^Not saved/);

  await retryGap(page).fill("200");
  await retryGap(page).press("Enter");
  await expect(page.getByText("Enter a whole number of hours from 1 to 168.")).toBeVisible();

  await page.reload();
  await formReady(page);
  await expect(until(page)).toHaveValue("18:00");
  await expect(retryGap(page)).toHaveValue("24");
});

test("at least one call day has to stay on", async ({ page }) => {
  await openSettings(page);
  for (const name of ["Mon", "Tue", "Wed", "Thu", "Fri"]) await day(page, name).uncheck();
  await expect(page.getByText("Pick at least one day.")).toBeVisible();
  await expect(status(page)).toHaveText(/^Not saved/);

  await page.reload();
  await formReady(page);
  await expect(day(page, "Fri")).toBeChecked();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("fits the screen", async ({ page }) => {
    await openSettings(page);
    await expect(day(page, "Sun")).toBeVisible();
    const main = page.getByRole("main");
    const { scrollWidth, clientWidth } = await main.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
