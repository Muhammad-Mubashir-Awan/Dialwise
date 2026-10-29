import { expect, test } from "@playwright/test";
import { open } from "./app";
import { seedCall, seedLead, unique } from "./db";

/** A time zone where it's between 09:00 and 14:00 now, so "later today" can't roll over to tomorrow mid-test. */
function middayZone(): string {
  const now = new Date();
  for (const zone of Intl.supportedValuesOf("timeZone")) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23" }).format(now),
    );
    if (hour >= 9 && hour < 14) return zone;
  }
  throw new Error("no zone at midday");
}

test.use({ timezoneId: middayZone() });

const HOUR = 3_600_000;
const inHours = (h: number) => new Date(Date.now() + h * HOUR);

test("follow-ups are grouped into overdue, due today and the next 7 days", async ({ page }) => {
  const overdue = `Amelia ${unique()}`;
  const today = `Marcus ${unique()}`;
  const meeting = `Grace ${unique()}`;
  const later = `Later ${unique()}`;
  const closed = `Tom ${unique()}`;
  const amelia = await seedLead({ name: overdue, status: "callback", nextFollowUpAt: inHours(-3), timezone: null });
  await seedCall(amelia.id, "callback", inHours(-27), "Call after the board meeting");
  await seedLead({ name: today, status: "interested", nextFollowUpAt: inHours(2), timezone: null });
  await seedLead({ name: meeting, status: "meeting_booked", nextFollowUpAt: inHours(72), timezone: null });
  await seedLead({ name: later, status: "callback", nextFollowUpAt: inHours(24 * 20), timezone: null });
  await seedLead({ name: closed, status: "do_not_call", nextFollowUpAt: inHours(-1), timezone: null });

  await open(page, "/follow-ups");
  const overdueRow = page
    .getByRole("region", { name: /^Overdue/ })
    .getByRole("row")
    .filter({ hasText: overdue });
  await expect(overdueRow).toContainText("3h overdue");
  await expect(overdueRow).toContainText("Callback");
  await expect(overdueRow).toContainText("Call after the board meeting");
  await expect(page.getByRole("region", { name: /^Due today/ })).toContainText(today);
  const meetingRow = page
    .getByRole("region", { name: /^Next 7 days/ })
    .getByRole("row")
    .filter({ hasText: meeting });
  await expect(meetingRow).toContainText("Meeting");
  await expect(meetingRow.getByRole("link", { name: "Open" })).toBeVisible();
  await expect(page.getByText(later)).toBeHidden();
  await expect(page.getByText(closed)).toBeHidden();
});

test("Call now from a follow-up opens it in the queue, and logging a call clears it", async ({ page, isMobile }) => {
  const name = `Priya ${unique()}`;
  const { id } = await seedLead({ name, status: "callback", nextFollowUpAt: inHours(-1), timezone: null });

  await open(page, "/follow-ups");
  const row = page
    .getByRole("region", { name: /^Overdue/ })
    .getByRole("row")
    .filter({ hasText: name });
  await row.getByRole("link", { name: "Call now" }).click();
  await expect(page).toHaveURL(new RegExp(`/queue\\?lead=${id}$`));
  await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();

  if (isMobile) {
    await page.getByRole("button", { name: /^No answer/ }).click();
  } else {
    await expect(page.locator("[data-keys-ready]")).toBeVisible();
    await page.keyboard.press("1");
  }
  await expect(page.getByText(`No answer logged for ${name}`)).toBeVisible();

  await open(page, "/follow-ups");
  await expect(page.getByRole("region", { name: /^Overdue/ })).toBeVisible();
  await expect(page.getByText(name)).toBeHidden();
});

test.describe("sidebar", () => {
  test.skip(({ isMobile }) => isMobile, "the sidebar is a menu on phones");

  test("shows how many leads are ready, follow-ups due today (red when overdue) and leads", async ({ page }) => {
    await seedLead({ name: `Overdue ${unique()}`, status: "callback", nextFollowUpAt: inHours(-2), timezone: null });

    await open(page, "/queue");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: /^Queue \d+$/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Follow-ups \d+\s*, \d+ overdue$/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Leads \d+$/ })).toBeVisible();
  });
});
