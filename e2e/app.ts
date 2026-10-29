import { expect, type Page } from "@playwright/test";

/** Opens an app page and waits until the shell's keyboard shortcuts are live. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-shell-ready", "true");
}
