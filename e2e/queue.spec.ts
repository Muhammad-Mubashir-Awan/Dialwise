import { expect, test, type Page } from "@playwright/test";
import { open } from "./app";
import { seedLead, seedList, unique } from "./db";

/** A list with leads that can be called any time (no known time zone), in this order. */
async function seedQueue(...names: string[]) {
  const listName = `Queue ${unique()}`;
  const listId = await seedList(listName);
  const leads = [];
  for (const name of names) leads.push(await seedLead({ name, listId, timezone: null }));
  return { listId, listName, leads };
}

async function openQueue(page: Page, path: string) {
  await open(page, path);
  await expect(page.locator("[data-keys-ready]")).toBeVisible();
}

const leadOnScreen = (page: Page, name: string) => page.getByRole("heading", { level: 2, name });

test.describe("keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard shortcuts are for desktop");

  test("work the queue: note, outcome keys, a follow-up, then nobody left", async ({ page }) => {
    const first = `Amelia ${unique()}`;
    const second = `Hannah ${unique()}`;
    const { listId, leads } = await seedQueue(first, second);

    await openQueue(page, `/queue?list=${listId}`);
    await expect(leadOnScreen(page, first)).toBeVisible();
    await expect(page.getByRole("region", { name: first }).getByText("First call")).toBeVisible();

    await page.keyboard.press("n");
    await page.keyboard.type("Rang out, no voicemail");
    await page.keyboard.press("Escape");
    await page.keyboard.press("1");
    await expect(page.getByText(`No answer logged for ${first}`)).toBeVisible();
    await expect(leadOnScreen(page, second)).toBeVisible();

    await page.keyboard.press("4");
    await expect(page.getByRole("group", { name: /Follow up/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText(`Callback logged for ${second}`)).toBeVisible();

    await expect(page.getByText("Nobody to call right now")).toBeVisible();
    await expect(
      page.getByText("Everyone in this list is waiting for a retry or for a follow-up later."),
    ).toBeVisible();

    await open(page, `/leads/${leads[0].id}`);
    const history = page.getByRole("region", { name: "Call history" });
    await expect(history).toContainText("No answer");
    await expect(history).toContainText("Rang out, no voicemail");
    await expect(page.getByText("Contacted", { exact: true })).toBeVisible();
  });

  test("two quick outcomes log two leads, and a lead still saving never comes back", async ({ page }) => {
    const names = ["Ava", "Ben", "Cal", "Dee"].map((n) => `${n} ${unique()}`);
    const { listId, leads } = await seedQueue(...names);

    await openQueue(page, `/queue?list=${listId}`);
    await expect(leadOnScreen(page, names[0])).toBeVisible();
    // Record every lead that appears on screen, in order.
    await page.evaluate(() => {
      const seen: string[] = [];
      Object.assign(window, { seenLeads: seen });
      const record = () => {
        const name = document.getElementById("queue-lead-name")?.textContent ?? "";
        if (seen.at(-1) !== name) seen.push(name);
      };
      record();
      new MutationObserver(record).observe(document.body, { subtree: true, childList: true, characterData: true });
    });

    await page.keyboard.press("1");
    await page.keyboard.press("1");
    await expect(page.getByText(`No answer logged for ${names[0]}`)).toBeVisible();
    await expect(page.getByText(`No answer logged for ${names[1]}`)).toBeVisible();
    await expect(leadOnScreen(page, names[2])).toBeVisible();

    expect(await page.evaluate(() => (window as unknown as { seenLeads: string[] }).seenLeads)).toEqual(
      names.slice(0, 3),
    );
    for (const lead of leads.slice(0, 2)) {
      await open(page, `/leads/${lead.id}`);
      await expect(page.getByRole("region", { name: "Call history" })).toContainText("1 call");
    }
  });

  test("U undoes the last call and brings the lead back", async ({ page }) => {
    const name = `Oliver ${unique()}`;
    const { listId } = await seedQueue(name);

    await openQueue(page, `/queue?list=${listId}`);
    await page.keyboard.press("7");
    await expect(page.getByText(`Not interested logged for ${name}`)).toBeVisible();
    await expect(page.getByText("No leads to call in this list")).toBeVisible();

    await page.keyboard.press("u");
    await expect(page.getByText(`Call removed. ${name} is back on screen.`)).toBeVisible();
    await expect(leadOnScreen(page, name)).toBeVisible();
    await expect(page.getByRole("region", { name })).toContainText("New");
  });

  test("S skips to the back of the queue, and G then S still opens stats", async ({ page }) => {
    const first = `Priya ${unique()}`;
    const second = `Marcus ${unique()}`;
    const { listId } = await seedQueue(first, second);

    await openQueue(page, `/queue?list=${listId}`);
    await page.keyboard.press("s");
    await expect(page.getByText(`Skipped ${first}. They're at the back of the queue.`)).toBeVisible();
    await expect(leadOnScreen(page, second)).toBeVisible();
    await expect(page.getByRole("list", { name: "Up next" })).toContainText(first);

    await page.keyboard.press("g");
    await page.keyboard.press("s");
    await expect(page).toHaveURL(/\/stats$/);
  });
});

test("log an outcome with a follow-up using the buttons", async ({ page }) => {
  const name = `Grace ${unique()}`;
  const { listId } = await seedQueue(name);

  await openQueue(page, `/queue?list=${listId}`);
  await page.getByRole("button", { name: /^Interested/ }).click();
  const followUp = page.getByRole("group", { name: /Follow up/ });
  await followUp.getByRole("button", { name: /Monday 10:00/ }).click();
  await expect(followUp.getByRole("button", { name: /Monday 10:00/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Log and next/ }).click();

  await expect(page.getByText(`Interested logged for ${name}`)).toBeVisible();
  await expect(page.getByText("Nobody to call right now")).toBeVisible();
  await expect(page.getByText(/1\s*follow-ups scheduled later/)).toBeVisible();
});

test("do-not-call and closed-out leads never come up", async ({ page }) => {
  const open1 = `Rohan ${unique()}`;
  const dnc = `Tom ${unique()}`;
  const listId = await seedList(`Queue ${unique()}`);
  await seedLead({ name: dnc, listId, timezone: null, status: "do_not_call" });
  await seedLead({ name: `Noah ${unique()}`, listId, timezone: null, status: "not_interested" });
  await seedLead({ name: open1, listId, timezone: null });

  await openQueue(page, `/queue?list=${listId}`);
  await expect(leadOnScreen(page, open1)).toBeVisible();
  await expect(page.getByText(dnc)).toBeHidden();
  await expect(page.getByText(/1\s*ready now/)).toBeVisible();
});

/** A time zone where it's outside 09:00–18:00 Monday to Friday right now. */
function zoneOutsideCallHours(): string {
  const now = new Date();
  for (const zone of Intl.supportedValuesOf("timeZone")) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "numeric", hourCycle: "h23" })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    const hour = Number(parts.hour);
    // Stay an hour clear of the edges so the test can't straddle a window opening.
    if (["Sat", "Sun"].includes(parts.weekday) || hour < 7 || hour >= 19) return zone;
  }
  throw new Error("no zone outside call hours");
}

test("a lead outside call hours waits, and can be called anyway", async ({ page }) => {
  const name = `Sofia ${unique()}`;
  const listId = await seedList(`Queue ${unique()}`);
  await seedLead({ name, listId, timezone: zoneOutsideCallHours() });

  await openQueue(page, `/queue?list=${listId}`);
  await expect(
    page.getByText("No leads in this list are inside their local call hours", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(`Next call window opens`, { exact: false })).toContainText(name);

  await page.getByRole("link", { name: `Call ${name} anyway` }).click();
  await expect(leadOnScreen(page, name)).toBeVisible();
  await expect(page.getByText("picked by you", { exact: false })).toBeVisible();
});

test("Call now on a lead's page puts that lead on screen", async ({ page }) => {
  const name = `Ethan ${unique()}`;
  const { id } = await seedLead({ name, timezone: null });

  await open(page, `/leads/${id}`);
  await page.getByRole("link", { name: "Call now" }).click();
  await expect(page).toHaveURL(new RegExp(`/queue\\?lead=${id}$`));
  await expect(leadOnScreen(page, name)).toBeVisible();
  await expect(page.getByText("picked by you", { exact: false })).toBeVisible();
});

test("Work list on the lists page opens the queue for that list", async ({ page }) => {
  const { listId, listName } = await seedQueue(`Ava ${unique()}`, `Leo ${unique()}`);

  await open(page, "/lists");
  await page.getByRole("link", { name: `Work ${listName}: 2 ready` }).click();
  await expect(page).toHaveURL(new RegExp(`/queue\\?list=${listId}$`));
  await expect(page.getByLabel("Work list")).toHaveValue(listId);
});
