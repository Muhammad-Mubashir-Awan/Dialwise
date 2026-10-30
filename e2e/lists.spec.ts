import { expect, test } from "@playwright/test";
import { open } from "./app";
import { seedCall, seedLead, seedList, unique } from "./db";

test("create, rename and delete a list", async ({ page }) => {
  const name = `Dentists ${unique()}`;
  const renamed = `${name} UK`;
  await open(page, "/lists");

  await page.getByRole("button", { name: "New list" }).click();
  await page.getByLabel("List name").fill(name);
  await page.getByRole("button", { name: "Create list" }).click();
  await expect(page.getByText(`Created ${name}`)).toBeVisible();
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Rename ${name}` }).click();
  await page.getByLabel("List name").fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: renamed, exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${renamed}` }).click();
  await page.getByRole("button", { name: "Delete list" }).click();
  await expect(page.getByText(`Deleted ${renamed}`)).toBeVisible();
  await expect(page.getByRole("link", { name: renamed, exact: true })).toBeHidden();
});

test("a list name that's already used is refused", async ({ page }) => {
  const name = `Agencies ${unique()}`;
  await seedList(name);
  await open(page, "/lists");

  await page.getByRole("button", { name: "New list" }).click();
  await page.getByLabel("List name").fill(name.toUpperCase());
  await page.getByRole("button", { name: "Create list" }).click();
  await expect(page.getByText("You already have a list called that.")).toBeVisible();
});

test("each list shows its counts and links to its leads", async ({ page }) => {
  const name = `Clinics ${unique()}`;
  const listId = await seedList(name);
  const priya = await seedLead({ name: `Priya ${unique()}`, listId, status: "interested" });
  const marcus = await seedLead({ name: `Marcus ${unique()}`, listId, status: "contacted" });
  await seedLead({ name: `Emma ${unique()}`, listId });
  await seedCall(priya.id, "no_answer", new Date());
  await seedCall(priya.id, "interested", new Date());
  await seedCall(marcus.id, "voicemail", new Date());
  await seedCall(marcus.id, "callback", new Date());

  await open(page, "/lists");
  const row = page.getByRole("row").filter({ has: page.getByRole("link", { name, exact: true }) });
  // Leads, never called, calls, conversation rate, interested or booked.
  await expect(row.getByRole("cell")).toHaveText([name, "3", "1", "4", "50%", "1", /Rename/]);

  await row.getByRole("link", { name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/leads\\?list=${listId}$`));
  await expect(page.getByText(/^3 of \d+ leads$/)).toBeVisible();
});

test("deleting a list keeps its leads", async ({ page }) => {
  const name = `Agents ${unique()}`;
  const listId = await seedList(name);
  const lead = await seedLead({ name: `Sofia ${unique()}`, listId });

  await open(page, "/lists");
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByText("Its lead stays, with no list.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Delete list" }).click();
  await expect(page.getByText(`Deleted ${name}`)).toBeVisible();

  await open(page, `/leads/${lead.id}`);
  await expect(page.getByRole("region", { name: "Details" })).toContainText("No list");
});
