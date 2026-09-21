import { expect, type Page } from "@playwright/test";

/**
 * Opens the converter and waits until its script has taken over the page.
 *
 * The buttons exist in the HTML before the script runs. A test that clicks
 * one too early clicks a button with nothing behind it, so every test waits
 * for the mark that the script sets when it is ready.
 */
export async function openConverter(page: Page): Promise<void> {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
}

/** Replaces the Markdown, the way a paste into the box would. */
export async function typeMarkdown(page: Page, markdown: string) {
  await page.locator("#source").fill(markdown);
}

/** Reads both forms from the clipboard. */
export async function readClipboard(page: Page) {
  return page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const out: Record<string, string> = {};
    for (const item of items) {
      for (const type of item.types) {
        out[type] = await (await item.getType(type)).text();
      }
    }
    return out;
  });
}

/** A chapter written for these tests. It comes from no published chapter. */
export const CHAPTER = `# (Chapter 3 || Volume 1) The Well.

The water was lower than she remembered.

**ELS**: Is it always this quiet?

**ART**: Only when it rains.

***End of Chapter 3***

***"The Well"***

[ Quiet is a kind of answer. ]
`;
