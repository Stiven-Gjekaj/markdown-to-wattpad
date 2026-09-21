import { readBlocks } from "./blocks";
import { buildSegments, type Kind } from "./paragraphs";
import { emptyFound, readLines, textOf } from "./runs";
import { readSource } from "./source";
import {
  type Align,
  type Paragraph,
  partHtml,
  partText,
  toParagraph,
} from "./wattpad";

export type { Align, Paragraph } from "./wattpad";

export interface Options {
  /** Where narration sits. Dialogue is always on the left. */
  narration: "center" | "left";
  joinDialogue: boolean;
  boldSpeakers: boolean;
  styleEnding: boolean;
}

/** The layout of every published chapter of the story this tool serves. */
export const DEFAULTS: Options = {
  narration: "center",
  joinDialogue: true,
  boldSpeakers: true,
  styleEnding: true,
};

export interface Conversion {
  /** The part title for the Wattpad title box, or "" when there is none. */
  title: string;
  paragraphs: Paragraph[];
  /** The body as Wattpad markup, for the clipboard. */
  html: string;
  /** The body as plain text, for the clipboard. */
  text: string;
  words: number;
}

/**
 * Converts one chapter of Markdown into one Wattpad part.
 *
 * The first line of the chapter, when it is a heading, is the part title.
 * Wattpad keeps the title in a box of its own above the text, so it is not
 * repeated in the body.
 */
export function convert(
  markdown: string,
  options: Options = DEFAULTS,
): Conversion {
  const found = emptyFound();
  const source = readSource(markdown);
  const blocks = readBlocks(source.body);

  let title = source.title;
  const first = blocks[0];
  if (first?.kind === "heading") {
    title = readLines(first.text, found).map(textOf).join(" ");
    blocks.shift();
  }

  const segments = buildSegments(blocks, options, found);
  const paragraphs = segments.map((segment) =>
    toParagraph(segment, alignOf(segment.kind, options)),
  );
  const text = partText(paragraphs);

  return {
    title,
    paragraphs,
    html: partHtml(paragraphs),
    text,
    words: countWords(text),
  };
}

function alignOf(kind: Kind, options: Options): Align {
  if (kind === "dialogue" || kind === "code") {
    return "left";
  }
  return options.narration;
}

/**
 * Counts words the way a reader would.
 *
 * A word is a run of characters between spaces that holds a letter or a
 * digit, so a dash between two spaces and a scene break are not words.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}
