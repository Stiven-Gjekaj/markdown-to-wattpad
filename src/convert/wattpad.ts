import type { Kind, Segment } from "./paragraphs";
import type { Line, Run } from "./runs";

/**
 * Writes paragraphs in the markup that Wattpad itself stores.
 *
 * Wattpad serves a part as a list of `<p>` elements. Each one carries its
 * alignment as `style="text-align:center;"`, and inside it there are only
 * `<b>`, `<i>`, `<u>`, and `<br>`. This file writes exactly that and nothing
 * more: no class, no font, no colour, no wrapper. What Wattpad writes, its
 * editor has to accept when a writer copies text from one part to another.
 */

export type Align = "left" | "center" | "right";

export interface Paragraph {
  kind: Kind;
  align: Align;
  /** The inside of the `<p>` element. */
  html: string;
  /** The same paragraph as plain text, with "\n" for a line break. */
  text: string;
}

const MARKS = [
  ["bold", "b"],
  ["italic", "i"],
  ["underline", "u"],
] as const;

export function toParagraph(segment: Segment, align: Align): Paragraph {
  return {
    kind: segment.kind,
    align,
    html: segment.lines.map(lineHtml).join("<br>"),
    text: segment.lines.map(lineText).join("\n"),
  };
}

/** The whole part, ready for the clipboard. */
export function partHtml(paragraphs: Paragraph[]): string {
  return paragraphs
    .map((p) => `<p style="text-align:${p.align};">${p.html}</p>`)
    .join("");
}

/**
 * The whole part as plain text.
 *
 * This is what an application receives when it cannot read HTML. A blank
 * line separates paragraphs, so that a paste into a plain text box still
 * shows where each one starts.
 */
export function partText(paragraphs: Paragraph[]): string {
  return paragraphs.map((p) => p.text).join("\n\n");
}

/**
 * Writes one line of runs as markup.
 *
 * The tags always nest in one order, bold outside italic outside underline,
 * which is the order Wattpad writes them in. A run keeps the tags that it
 * shares with the run before it open, so "**NES *says***" gives
 * `<b>NES <i>says</i></b>` and not two separate bold elements.
 */
function lineHtml(line: Line): string {
  let html = "";
  let open: string[] = [];
  for (const run of line) {
    const want = MARKS.filter(([mark]) => run[mark]).map(([, tag]) => tag);
    let keep = 0;
    while (keep < open.length && open[keep] === want[keep]) {
      keep += 1;
    }
    for (let index = open.length - 1; index >= keep; index -= 1) {
      html += `</${open[index]}>`;
    }
    for (const tag of want.slice(keep)) {
      html += `<${tag}>`;
    }
    open = want;
    html += escapeHtml(run.text);
  }
  for (let index = open.length - 1; index >= 0; index -= 1) {
    html += `</${open[index]}>`;
  }
  return html;
}

function lineText(line: Line): string {
  return line.map((run: Run) => run.text).join("");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
