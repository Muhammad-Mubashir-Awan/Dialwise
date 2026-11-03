import { expect, test } from "@playwright/test";
import { open } from "./app";
import { seedCall, seedLead, seedList, unique } from "./db";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** A list with three calls: no answer and interested on one lead, a booked meeting on another. */
async function seedCalls() {
  const name = `Stats ${unique()}`;
  const listId = await seedList(name);
  const amelia = await seedLead({ name: `Amelia ${unique()}`, listId, status: "interested" });
  const grace = await seedLead({ name: `Grace ${unique()}`, listId, status: "meeting_booked" });
  await seedCall(amelia.id, "no_answer", minutesAgo(30));
  await seedCall(amelia.id, "interested", minutesAgo(20));
  await seedCall(grace.id, "meeting_booked", minutesAgo(10));
  return name;
}

test("shows the headline figures, outcomes and a row for each list", async ({ page }) => {
  const list = await seedCalls();
  await open(page, "/stats");

  for (const label of ["Calls", "Conversation rate", "Interested or booked", "Meetings booked"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Outcomes" })).toContainText("Meeting booked");

  // Calls, conversation rate, interested or booked, meetings.
  const row = page.getByRole("row").filter({ hasText: list });
  await expect(row.getByRole("cell")).toHaveText([list, "3", "66.7%", "2", "1"]);
});

test("switches between the last 7 and 30 days", async ({ page }) => {
  await seedCalls();
  await open(page, "/stats");
  const chart = page.getByRole("img", { name: /^Calls per day over the last 7 days/ });
  await expect(chart).toBeVisible();
  await expect(page.getByRole("button", { name: "Last 7 days" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Last 30 days" }).click();
  await expect(page.getByRole("button", { name: "Last 30 days" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: /^Calls per day over the last 30 days/ })).toBeVisible();
});

test("the chart is also available as a table, one row per day", async ({ page }) => {
  await seedCalls();
  await open(page, "/stats");
  const panel = page.getByRole("region", { name: "Calls per day" });

  await panel.getByRole("button", { name: "Show as table" }).click();
  await expect(panel.getByRole("row")).toHaveCount(8); // the header and 7 days
  await expect(panel.getByRole("columnheader")).toHaveText(["Day", "Calls", "Conversations", "No conversation"]);
  // Our three calls are in there, whether on one day or either side of midnight.
  const counts = await panel.getByRole("row").locator("td:nth-child(2)").allInnerTexts();
  expect(counts.reduce((sum, n) => sum + Number(n), 0)).toBeGreaterThanOrEqual(3);

  await panel.getByRole("button", { name: "Show chart" }).click();
  await expect(page.getByRole("img", { name: /^Calls per day/ })).toBeVisible();
});

test("pointing at a day shows its calls", async ({ page, isMobile }) => {
  test.skip(isMobile, "Pointing needs a mouse; the table covers touch and screen readers.");
  await seedCalls();
  await open(page, "/stats");
  const chart = page.getByRole("img", { name: /^Calls per day/ });
  const box = await chart.boundingBox();
  if (!box) throw new Error("chart has no size");

  // The last slot on the right is today.
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  // The tooltip names the day, then its calls and conversations (the legend says "Conversation" with no number).
  await expect(page.getByText(/^\d+ conversations?$/)).toBeVisible();
  await expect(page.getByText(/^\d+ calls?$/)).toBeVisible();
});

test("a call logged moments ago is counted when you go straight to Stats", async ({ page, isMobile }) => {
  test.skip(isMobile, "the sidebar is a menu on phones");
  const name = `Stats ${unique()}`;
  const lead = await seedLead({ name: `Amelia ${unique()}`, listId: await seedList(name) });
  await open(page, "/leads");
  // Long enough for the page's shared clock to be behind the call below.
  await page.waitForTimeout(2000);
  await seedCall(lead.id, "interested", new Date());
  await page.getByRole("link", { name: "Stats" }).click();
  await expect(page.getByRole("row").filter({ hasText: name }).getByRole("cell")).toHaveText([
    name,
    "1",
    "100.0%",
    "1",
    "0",
  ]);
});

test("fits the screen on a phone", async ({ page }) => {
  await seedCalls();
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, "/stats");
  await expect(page.getByRole("img", { name: /^Calls per day/ })).toBeVisible();

  const main = page.getByRole("main");
  const { scrollWidth, clientWidth } = await main.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
