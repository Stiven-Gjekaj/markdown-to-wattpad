import { expect, test } from "@playwright/test";
import { CHAPTER, openConverter, readClipboard, typeMarkdown } from "./helpers";

/**
 * The clipboard is the product. These tests copy the way a writer does,
 * then read the clipboard back, and then paste into a rich text editor to
 * see what an editor receives.
 */

const EXPECTED_HTML =
  '<p style="text-align:center;">The water was lower than she remembered.</p>' +
  '<p style="text-align:left;"><b>ELS</b>: Is it always this quiet?<br>' +
  "<b>ART</b>: Only when it rains.</p>" +
  '<p style="text-align:center;"><b><i><u>End of Chapter 3</u></i></b><br>' +
  '<b><i><u>"The Well"</u></i></b></p>' +
  '<p style="text-align:center;"><b>[ Quiet is a kind of answer. ]</b></p>';

test.describe("copying for Wattpad", () => {
  // Only one of the two projects needs to check the clipboard. The phone
  // project runs the same browser engine, and two runs would share one
  // system clipboard.
  test.skip(({ isMobile }) => isMobile, "The desktop project covers this.");

  test.beforeEach(async ({ context, baseURL }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(baseURL ?? "http://127.0.0.1:4173").origin,
    });
  });

  test("puts the Wattpad markup and plain text on the clipboard", async ({
    page,
  }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByRole("button", { name: "Copy text for Wattpad" }).click();
    await expect(page.locator("#status")).toHaveText(/^Copied\./);

    const clipboard = await readClipboard(page);
    // A browser may put a charset tag or a wrapper around the fragment, so
    // the test asks whether the fragment is in there, whole.
    expect(clipboard["text/html"]).toContain(EXPECTED_HTML);
    expect(clipboard["text/plain"]).toBe(
      [
        "The water was lower than she remembered.",
        "ELS: Is it always this quiet?\nART: Only when it rains.",
        'End of Chapter 3\n"The Well"',
        "[ Quiet is a kind of answer. ]",
      ].join("\n\n"),
    );
  });

  test("keeps the layout when pasted into a rich text editor", async ({
    page,
  }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByRole("button", { name: "Copy text for Wattpad" }).click();
    await expect(page.locator("#status")).toHaveText(/^Copied\./);

    // An editable box stands in for an editor such as the Wattpad writer.
    // The paste goes through the browser's own paste, with the keyboard.
    await page.evaluate(() => {
      const editor = document.createElement("div");
      editor.id = "editor";
      editor.contentEditable = "true";
      document.body.append(editor);
      editor.focus();
    });
    await page.keyboard.press("ControlOrMeta+V");

    const editor = page.locator("#editor");
    await expect(editor.locator("p")).toHaveCount(4);
    await expect(editor.locator("p").nth(0)).toHaveCSS("text-align", "center");
    // The browser drops "text-align:left" on a paste, because left is where
    // a paragraph sits already. It keeps "center", which is not. So the
    // dialogue arrives with the default alignment, which is the left.
    await expect(editor.locator("p").nth(1)).toHaveCSS(
      "text-align",
      /^(left|start)$/,
    );
    await expect(editor.locator("p").nth(1).locator("b")).toHaveText([
      "ELS",
      "ART",
    ]);
    await expect(editor.locator("p").nth(2).locator("u")).toHaveText([
      "End of Chapter 3",
      '"The Well"',
    ]);
    await expect(editor).not.toContainText("*");
  });

  test("copies the title as plain text", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByRole("button", { name: "Copy title" }).click();
    await expect(page.locator("#status")).toHaveText(/^Title copied\./);
    const clipboard = await readClipboard(page);
    expect(clipboard["text/plain"]).toBe("(Chapter 3 || Volume 1) The Well.");
  });

  test("copies the plain text alone", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await page.getByRole("button", { name: "Copy plain text" }).click();
    const clipboard = await readClipboard(page);
    expect(clipboard["text/plain"]).toContain("ELS: Is it always this quiet?");
    expect(clipboard["text/html"]).toBeUndefined();
  });

  test("cleans a copy made by hand from the preview", async ({ page }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    // The preview draws on the next frame, so wait for it before selecting.
    await expect(page.locator("#preview p")).toHaveCount(4);
    // Focus first: focusing the preview clears a selection made before it.
    await page.locator("#preview").focus();
    await page.evaluate(() => {
      const preview = document.getElementById("preview");
      const range = document.createRange();
      range.selectNodeContents(preview as Node);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await page.keyboard.press("ControlOrMeta+C");

    const clipboard = await readClipboard(page);
    expect(clipboard["text/html"]).toContain(EXPECTED_HTML);
    // The preview carries ids and a class for its own use. None of that, and
    // none of its fonts or colours, may reach the clipboard.
    expect(clipboard["text/html"]).not.toMatch(/\sid=|\sclass=|font-family/);
  });

  test("leaves the clipboard alone when nothing is selected", async ({
    page,
  }) => {
    await openConverter(page);
    await typeMarkdown(page, CHAPTER);
    await expect(page.locator("#preview p")).toHaveCount(4);
    await page.evaluate(() => navigator.clipboard.writeText("kept"));
    await page.locator("#preview").focus();
    // A caret inside the preview text, with nothing selected, as a click
    // leaves it. A selection outside the preview would test a different
    // guard.
    await page.evaluate(() => {
      const text = document.querySelector("#preview p")?.firstChild;
      const range = document.createRange();
      range.setStart(text as Node, 3);
      range.collapse(true);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await page.keyboard.press("ControlOrMeta+C");
    const clipboard = await readClipboard(page);
    expect(clipboard["text/plain"]).toBe("kept");
  });
});
