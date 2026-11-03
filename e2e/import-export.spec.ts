import { expect, test, type Page, type Route } from "@playwright/test";
import { open } from "./app";
import { randomUkPhone, seedCall, seedLead, seedList, unique } from "./db";

async function upload(page: Page, name: string, csv: string) {
  await page.locator("#import-file").setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(csv) });
}

test("reviewing an import after the session has ended goes to sign-in", async ({ page, context }) => {
  await open(page, "/import");
  await upload(page, "late.csv", `Name,Mobile\nLate,${randomUkPhone().local}\n`);
  await context.clearCookies();
  await page.getByRole("button", { name: "Review import" }).click();
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fimport$/);
});

test("a dropped connection during an import says so and lets you try again", async ({ page }) => {
  await open(page, "/import");
  await upload(page, "dropped.csv", `Name,Mobile\nDropped,${randomUkPhone().local}\n`);
  const block = (route: Route) => (route.request().method() === "POST" ? route.abort() : route.continue());
  await page.route("**/import", block);

  await page.getByRole("button", { name: "Review import" }).click();
  await expect(page.getByText("Couldn't check the file. Check your connection, then try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Review import" })).toBeVisible();

  await page.unroute("**/import", block);
  await page.getByRole("button", { name: "Review import" }).click();
  await page.route("**/import", block);
  await page.getByRole("button", { name: /^Import \d+ lead/ }).click();
  await expect(page.getByText("Nothing was imported. Check your connection, then try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Import \d+ lead/ })).toBeEnabled();
});

test("an Industry column is matched, imported and exported", async ({ page, request }) => {
  const listName = `Industry ${unique()}`;
  const listId = await seedList(listName);
  const name = `Amelia ${unique()}`;
  await open(page, "/import");
  await page.getByLabel("Add leads to").selectOption(listId);
  await upload(page, "industry.csv", `Name,Mobile,Industry\n${name},${randomUkPhone().local},Dentistry\n`);
  await expect(page.getByLabel("Import Industry as")).toHaveValue("industry");
  await page.getByRole("button", { name: "Review import" }).click();
  await page.getByRole("button", { name: /^Import \d+ lead/ }).click();

  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("region", { name: "Details" })).toContainText("Dentistry");

  const exported = await (await request.get(`/api/export?type=leads&list=${listId}`)).text();
  expect(exported).toContain("Industry");
  expect(exported).toContain("Dentistry");
});

test("import a CSV: match columns, review what will happen, then land on the list", async ({ page }) => {
  const listName = `Import ${unique()}`;
  const listId = await seedList(listName);
  const existing = randomUkPhone();
  const doNotCall = randomUkPhone();
  await seedLead({ name: `Already ${unique()}`, phoneE164: existing.e164 });
  await seedLead({ name: `Blocked ${unique()}`, phoneE164: doNotCall.e164, status: "do_not_call" });
  const [first, second] = [randomUkPhone(), randomUkPhone()];
  const [amelia, hannah] = [`Amelia ${unique()}`, `Hannah ${unique()}`];
  const csv = [
    "Business Name,Contact,Mobile,Country,Notes",
    `Brightpath,${amelia},${first.local},GB,Met at SaaStock`,
    `Tidewater,${hannah},${second.local},UK,`,
    `Dupe Ltd,Someone,${existing.local},GB,`,
    `Blocked Ltd,Someone else,${doNotCall.local},GB,`,
    "Mystery Ltd,Unknown,n/a,GB,",
    `Brightpath again,${amelia},+44 ${first.local.slice(1)},GB,`,
  ].join("\n");

  await open(page, "/import");
  await page.getByLabel("Add leads to").selectOption(listId);
  await upload(page, "leads.csv", csv);

  await expect(page.getByText("leads.csv")).toBeVisible();
  await expect(page.getByText("· 6 rows")).toBeVisible();
  await expect(page.getByLabel("Import Mobile as")).toHaveValue("phone");
  await expect(page.getByLabel("Import Business Name as")).toHaveValue("company");
  await expect(page.getByLabel("Import Contact as")).toHaveValue("name");
  await page.getByRole("button", { name: "Review import" }).click();

  const tile = (label: string) =>
    page
      .locator("div")
      .filter({ has: page.getByText(label, { exact: true }) })
      .last();
  await expect(tile("Will be added")).toContainText("2");
  await expect(tile("Already in your CRM")).toContainText("2");
  await expect(tile("Invalid phone")).toContainText("1");
  await expect(tile("On do-not-call list")).toContainText("1");
  await expect(page.getByRole("region", { name: "Rows with an invalid phone" })).toContainText("Line 6");

  await page.getByRole("button", { name: "Import 2 leads" }).click();
  await expect(page).toHaveURL(new RegExp(`/leads\\?list=${listId}$`));
  await expect(page.getByText(`Imported 2 leads into ${listName}. 4 skipped`, { exact: false })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table).toContainText(amelia);
  await expect(table).toContainText("Brightpath");
  await expect(table).toContainText(hannah);
  await expect(page.getByText(/^2 of \d+ leads$/)).toBeVisible();
});

test("a file needs a phone column and at least one row", async ({ page }) => {
  await open(page, "/import");
  await upload(page, "empty.csv", "Name,Phone\n");
  await expect(page.getByText("That file has no data rows.", { exact: false })).toBeVisible();

  await upload(page, "no-phone.csv", "Name,Company\nAmelia,Brightpath\n");
  await expect(page.getByText("Pick the column that holds phone numbers.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review import" })).toBeDisabled();
  await page.getByLabel("Import Company as").selectOption("phone");
  await expect(page.getByRole("button", { name: "Review import" })).toBeEnabled();
});

test("export a list's leads and its call history as CSV", async ({ page }) => {
  const listName = `Export ${unique()}`;
  const listId = await seedList(listName);
  const name = `Priya ${unique()}`;
  const lead = await seedLead({ name, listId, tags: ["dental"] });
  await seedCall(lead.id, "no_answer", new Date(), "Rang out");

  await open(page, "/lists");
  const link = page.getByRole("link", { name: `Export ${listName} leads` });
  await expect(link).toHaveAttribute("href", `/api/export?type=leads&list=${listId}`);

  const leadsCsv = await page.request.get(`/api/export?type=leads&list=${listId}`);
  expect(leadsCsv.status()).toBe(200);
  expect(leadsCsv.headers()["content-type"]).toBe("text/csv; charset=utf-8");
  const leadsText = await leadsCsv.text();
  expect(leadsText).toContain(`${name},`);
  expect(leadsText).toContain(`'${lead.phoneE164}`);
  expect(leadsText.trim().split("\r\n")).toHaveLength(2);

  const callsText = await (await page.request.get(`/api/export?type=calls&list=${listId}`)).text();
  expect(callsText).toContain(`${name},`);
  expect(callsText).toContain("No answer,Rang out");
});

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("export refuses without a signed-in owner", async ({ request }) => {
    const response = await request.get("/api/export?type=leads");
    expect(response.status()).toBe(401);
    expect(await response.text()).not.toContain("Name,Company");
  });
});
