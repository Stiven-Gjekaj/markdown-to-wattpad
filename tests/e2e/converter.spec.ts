import { expect, test } from "@playwright/test";
import { CHAPTER, openConverter, typeMarkdown } from "./helpers";

test.describe("the converter page", () => {
  test("starts empty, with the copy buttons off", async ({ page }) => {
    await openConverter(page);
    await expect(page.locator("#preview")).toHaveClass(/empty/);
    await expect(page.locator("#copy-text")).toBeDisabled();
    await expect(page.locator("#copy-title")).toBeDisabled();
  });

  test("shows the Wattpad layout as the writer types", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);

    await expect(page.locator("#part-title")).toHaveText(
      "(Chapter 3 || Volume 1) The Well.",
    );
    const paragraphs = page.locator("#preview p");
    await expect(paragraphs).toHaveCount(4);
    await expect(paragraphs.nth(0)).toHaveCSS("text-align", "center");
    await expect(paragraphs.nth(1)).toHaveCSS("text-align", "left");
    await expect(paragraphs.nth(1).locator("b")).toHaveText(["ELS", "ART"]);
    await expect(paragraphs.nth(2).locator("b > i > u")).toHaveText([
      "End of Chapter 3",
      '"The Well"',
    ]);
    await expect(paragraphs.nth(3).locator("b")).toHaveText(
      "[ Quiet is a kind of answer. ]",
    );
    await expect(page.locator("#stats")).toContainText("4 paragraphs");
    await expect(page.locator("#copy-text")).toBeEnabled();
  });

  test("loads the example and converts it", async ({ page }) => {
    await openConverter(page);
    await page.getByRole("button", { name: "Example" }).click();
    await expect(page.locator("#source")).toHaveValue(/End of Chapter 12/);
    await expect(page.locator("#preview p").first()).toBeVisible();
    await expect(page.locator("#notices li")).toHaveCount(0);
  });

  test("changes the layout when an option changes", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    const first = page.locator("#preview p").first();
    await expect(first).toHaveCSS("text-align", "center");

    await page.getByText("Centre the narration").click();
    await expect(first).toHaveCSS("text-align", "left");
  });

  test("keeps the draft and the options across a reload", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByText("Join dialogue lines into one block").click();
    await expect(page.locator("#preview p")).toHaveCount(5);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#source")).toHaveValue(CHAPTER);
    await expect(page.locator("#opt-join")).not.toBeChecked();
    await expect(page.locator("#preview p")).toHaveCount(5);
  });

  test("warns about a mark with no partner, and points at it", async ({
    page,
  }) => {
    await openConverter(page);
    await typeMarkdown(page, "Clean.\n\nA ** stray mark.");
    const notice = page.locator("#notices li");
    await expect(notice).toHaveCount(1);
    await expect(notice).toContainText("Paragraph 2 still shows asterisks");
    await expect(page.locator("#preview p.stray")).toHaveCount(1);

    await notice.getByRole("link").click();
    await expect(page).toHaveURL(/#p2$/);
  });

  test("opens a Markdown file", async ({ page }) => {
    await openConverter(page);
    await page.locator("#open-file").setInputFiles({
      name: "chapter.md",
      mimeType: "text/markdown",
      buffer: Buffer.from(CHAPTER),
    });
    await expect(page.locator("#source")).toHaveValue(CHAPTER);
    await expect(page.locator("#status")).toHaveText("Opened chapter.md.");
  });

  test("fits a narrow screen without sideways scrolling", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("sends nothing to another host", async ({ page }) => {
    // The page promises that the chapter never leaves the device. Every
    // request it makes, while it loads and while it converts, must go to
    // the host that serves it.
    const hosts = new Set<string>();
    page.on("request", (request) => {
      hosts.add(new URL(request.url()).host);
    });
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByRole("button", { name: "Example" }).click();
    expect([...hosts]).toEqual(["127.0.0.1:4173"]);
  });
});
