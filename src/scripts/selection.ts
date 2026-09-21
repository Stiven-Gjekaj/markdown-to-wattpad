import { escapeHtml } from "../convert/wattpad";

/**
 * Cleans a copy that the writer makes by hand from the preview.
 *
 * A writer may select part of the preview and press the copy keys instead of
 * using a button. The browser would then copy the preview as it looks, with
 * its fonts, its colours, and its classes. This handler puts the same clean
 * markup on the clipboard that the buttons do, for just the selected part.
 */
export function cleanCopy(preview: HTMLElement): void {
  preview.addEventListener("copy", (event) => {
    const selection = document.getSelection();
    // With nothing selected, the browser copies nothing and leaves the
    // clipboard as it was. Filling it here with an empty string would wipe
    // whatever the writer copied before.
    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !event.clipboardData
    ) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!preview.contains(range.commonAncestorContainer)) {
      return;
    }
    const fragment = range.cloneContents();

    // A selection inside one paragraph holds no <p> of its own, so it would
    // lose its alignment. Wrap it in a copy of the paragraph it came from.
    const start = range.commonAncestorContainer;
    const paragraph = (
      start instanceof Element ? start : start.parentElement
    )?.closest("p");
    let root: Node = fragment;
    if (paragraph && preview.contains(paragraph)) {
      const wrapper = document.createElement("p");
      wrapper.style.textAlign = paragraph.style.textAlign;
      wrapper.append(fragment);
      root = wrapper;
    }

    event.clipboardData.setData("text/html", toHtml(root));
    event.clipboardData.setData("text/plain", toText(root).trim());
    event.preventDefault();
  });
}

const MARKS = new Set(["B", "I", "U"]);

function toHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? "");
  }
  const inner = Array.from(node.childNodes).map(toHtml).join("");
  if (!(node instanceof HTMLElement)) {
    return inner;
  }
  if (node.tagName === "BR") {
    return "<br>";
  }
  if (MARKS.has(node.tagName)) {
    const tag = node.tagName.toLowerCase();
    return inner === "" ? "" : `<${tag}>${inner}</${tag}>`;
  }
  if (node.tagName === "P") {
    const align = node.style.textAlign || "left";
    return `<p style="text-align:${align};">${inner}</p>`;
  }
  return inner;
}

function toText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node instanceof HTMLElement && node.tagName === "BR") {
    return "\n";
  }
  const inner = Array.from(node.childNodes).map(toText).join("");
  if (node instanceof HTMLElement && node.tagName === "P") {
    return `${inner}\n\n`;
  }
  return inner;
}
