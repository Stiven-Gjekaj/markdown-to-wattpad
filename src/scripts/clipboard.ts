/**
 * Puts the part on the clipboard.
 *
 * The text goes on in two forms at once. An editor that reads HTML, such as
 * the Wattpad writer in a browser, takes the markup with its bold, italics,
 * underline, and alignment. An editor that reads only plain text takes the
 * plain form, with a blank line between paragraphs.
 *
 * The markup is written here, not copied out of the page. Copying the page
 * would carry its fonts and its colours along, and a dark theme would arrive
 * in Wattpad as pale text.
 */

export async function copyRich(html: string, text: string): Promise<boolean> {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch {
      // A browser that refuses the modern call can still take the old one.
    }
  }
  return copyWithEvent({ "text/html": html, "text/plain": text });
}

export async function copyPlain(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back as above.
    }
  }
  return copyWithEvent({ "text/plain": text });
}

/**
 * The older way: ask the browser to copy, and fill the clipboard from the
 * copy event. It works in every browser that this site supports, as long as
 * it runs inside a click.
 */
function copyWithEvent(data: Record<string, string>): boolean {
  const fill = (event: ClipboardEvent) => {
    if (!event.clipboardData) {
      return;
    }
    for (const [type, value] of Object.entries(data)) {
      event.clipboardData.setData(type, value);
    }
    event.preventDefault();
  };
  document.addEventListener("copy", fill);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.removeEventListener("copy", fill);
  }
}
