import { expect, test, type Page } from "@playwright/test";
import { open } from "./app";
import { randomUkPhone, randomUsPhone, seedCall, seedLead, unique } from "./db";

async function openAddLead(page: Page, isMobile: boolean) {
  await open(page, "/leads");
  if (isMobile) await page.getByRole("button", { name: "Add lead" }).click();
  else {
    await expect(page.locator("html")).toHaveAttribute("data-lead-shortcut", "a");
    await page.keyboard.press("a");
  }
  const dialog = page.getByRole("dialog", { name: "Add lead" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("add a lead and land on its page", async ({ page, isMobile }) => {
  const name = `Amelia ${unique()}`;
  const phone = randomUkPhone();
  const dialog = await openAddLead(page, isMobile);

  await dialog.getByLabel("Name *").fill(name);
  await dialog.getByLabel("Company").fill("Brightpath Analytics");
  await dialog.getByLabel("Phone *").fill(phone.local);
  await dialog.getByLabel("Tags").fill("SaaS, warm");
  await dialog.getByRole("button", { name: "Add lead" }).click();

  await expect(page).toHaveURL(/\/leads\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText(`Added ${name}`)).toBeVisible();
  const details = page.getByRole("region", { name: "Details" });
  await expect(details).toContainText(phone.e164);
  await expect(details).toContainText("United Kingdom");
  await expect(details).toContainText("Europe/London");
  await expect(details).toContainText("saas");
  await expect(page.getByRole("region", { name: "Call history" })).toContainText("No calls yet.");
});

test("form problems are shown next to the fields and what was typed stays", async ({ page, isMobile }) => {
  const dialog = await openAddLead(page, isMobile);
  await dialog.getByLabel("Phone *").fill("12");
  await dialog.getByRole("button", { name: "Add lead" }).click();

  await expect(dialog.getByText("Enter the person's name.")).toBeVisible();
  await expect(dialog.getByText("This doesn't look like a phone number.", { exact: false })).toBeVisible();
  await expect(dialog.getByLabel("Phone *")).toHaveValue("12");
  await expect(dialog.getByLabel("Name *")).toBeFocused();
});

test("a number that another lead has is refused, naming that lead", async ({ page, isMobile }) => {
  const existing = `Oliver ${unique()}`;
  const phone = randomUkPhone();
  await seedLead({ name: existing, phoneE164: phone.e164 });

  const dialog = await openAddLead(page, isMobile);
  await dialog.getByLabel("Name *").fill(`Someone ${unique()}`);
  await dialog.getByLabel("Phone *").fill(phone.local);
  await dialog.getByRole("button", { name: "Add lead" }).click();

  await expect(dialog.getByText(`${existing} already has this number.`)).toBeVisible();
});

test("time zone choices follow the country", async ({ page, isMobile }) => {
  const name = `Priya ${unique()}`;
  const phone = randomUsPhone();
  const dialog = await openAddLead(page, isMobile);

  await dialog.getByLabel("Country").selectOption("US");
  await expect(dialog.getByText("United States has several time zones.", { exact: false })).toBeVisible();
  await dialog.getByLabel("Time zone").selectOption("America/New_York");
  await dialog.getByLabel("Name *").fill(name);
  await dialog.getByLabel("Phone *").fill(phone.local);
  await dialog.getByRole("button", { name: "Add lead" }).click();

  const details = page.getByRole("region", { name: "Details" });
  await expect(details).toContainText(phone.e164);
  await expect(details).toContainText("United States");
  await expect(details).toContainText("America/New_York");
});

test("filter by tag and status, then search", async ({ page }) => {
  const tag = `t${unique()}`;
  const amelia = `Amelia ${unique()}`;
  const hannah = `Hannah ${unique()}`;
  await seedLead({ name: amelia, tags: [tag], status: "interested" });
  await seedLead({ name: hannah, tags: [tag] });

  await open(page, `/leads?tag=${tag}`);
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(3); // header + 2 leads
  await expect(page.getByText(/^2 of \d+ leads$/)).toBeVisible();

  await page.getByLabel("Status").selectOption("interested");
  await expect(page).toHaveURL(/status=interested/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText(amelia);

  await page.getByLabel("Status").selectOption("");
  await expect(rows).toHaveCount(3);
  await page.getByLabel("Search leads").fill(hannah);
  await expect(page).toHaveURL(/q=Hannah/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText(hannah);
});

test.describe("keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard shortcuts are for desktop");

  test("/ searches, J and K move, Enter opens", async ({ page }) => {
    const tag = `t${unique()}`;
    const first = `Zed ${unique()}`;
    const second = `Yan ${unique()}`;
    await seedLead({ name: first, tags: [tag] });
    await seedLead({ name: second, tags: [tag] }); // newest, so listed first

    await open(page, `/leads?tag=${tag}`);
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
    await expect(page.locator("table[data-keys-ready]")).toBeVisible();
    await page.keyboard.press("/");
    await expect(page.getByLabel("Search leads")).toBeFocused();
    await page.keyboard.press("Escape");

    await page.keyboard.press("j");
    await page.keyboard.press("k");
    await page.keyboard.press("j");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: first })).toBeVisible();
  });
});

test("edit a lead", async ({ page, isMobile }) => {
  const name = `Daniel ${unique()}`;
  const { id } = await seedLead({ name, company: "Ledgerly" });

  await open(page, `/leads/${id}`);
  if (isMobile) await page.getByRole("button", { name: "Edit" }).click();
  else {
    await expect(page.locator("html")).toHaveAttribute("data-lead-shortcut", "e");
    await page.keyboard.press("e");
  }
  const dialog = page.getByRole("dialog", { name: "Edit lead" });
  await expect(dialog.getByLabel("Company")).toHaveValue("Ledgerly");
  await dialog.getByLabel("Company").fill("Ledgerly Ltd");
  await dialog.getByLabel("Role").fill("CEO");
  await dialog.getByLabel("Industry").fill("Accounting software");
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Lead saved")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("CEO at Ledgerly Ltd")).toBeVisible();
  await expect(page.getByRole("region", { name: "Details" })).toContainText("Accounting software");
});

test("a lead's page shows its call history, newest first", async ({ page }) => {
  const { id } = await seedLead({ name: `Priya ${unique()}` });
  await seedCall(id, "voicemail", new Date(Date.now() - 50 * 3_600_000), "Left voicemail with short pitch.");
  await seedCall(id, "callback", new Date(Date.now() - 2 * 3_600_000), "Call back after their board meeting.");

  await open(page, `/leads/${id}`);
  const history = page.getByRole("region", { name: "Call history" });
  await expect(history).toContainText("2 calls");
  const items = history.getByRole("listitem");
  await expect(items.nth(0)).toContainText("Callback");
  await expect(items.nth(0)).toContainText("Call back after their board meeting.");
  await expect(items.nth(1)).toContainText("Voicemail");
});

test("delete a lead after confirming", async ({ page }) => {
  const name = `Tom ${unique()}`;
  const { id } = await seedLead({ name });
  await seedCall(id, "no_answer", new Date());

  await open(page, `/leads/${id}`);
  await page.getByRole("button", { name: "Delete lead" }).click();
  await expect(page.getByText(`Delete ${name} and their call history?`)).toBeVisible();
  await page.getByRole("button", { name: "Delete lead" }).click();

  await expect(page).toHaveURL(/\/leads$/);
  await expect(page.getByText(`Deleted ${name}`)).toBeVisible();
  await page.goto(`/leads/${id}`);
  await expect(page.getByText("This lead doesn't exist")).toBeVisible();
});
