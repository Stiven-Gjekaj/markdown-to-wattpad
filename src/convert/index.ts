import { readBlocks } from "./blocks";
import { buildSegments, type Kind } from "./paragraphs";
import { emptyFound, type Found, readLines, STRAY, textOf } from "./runs";
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

export type Notice =
  | { kind: "image"; alts: string[] }
  | { kind: "link"; count: number }
  | { kind: "strike"; count: number }
  | { kind: "code"; count: number }
  | { kind: "tag"; names: string[] }
  | { kind: "stray"; paragraphs: number[] }
  | { kind: "dash"; count: number };

export interface Conversion {
  /** The part title for the Wattpad title box, or "" when there is none. */
  title: string;
  paragraphs: Paragraph[];
  /** The body as Wattpad markup, for the clipboard. */
  html: string;
  /** The body as plain text, for the clipboard. */
  text: string;
  words: number;
  notices: Notice[];
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
    notices: notices(found, paragraphs),
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

function notices(found: Found, paragraphs: Paragraph[]): Notice[] {
  const list: Notice[] = [];
  if (found.images.length > 0) {
    list.push({ kind: "image", alts: found.images });
  }
  if (found.links > 0) {
    list.push({ kind: "link", count: found.links });
  }
  if (found.struck > 0) {
    list.push({ kind: "strike", count: found.struck });
  }
  if (found.code > 0) {
    list.push({ kind: "code", count: found.code });
  }
  if (found.tags.length > 0) {
    list.push({ kind: "tag", names: [...new Set(found.tags)] });
  }

  // An asterisk left in the text is almost always a bold or italic mark that
  // lost its partner, as in "**[Volume 7] **", where the space before the
  // closing marks stops them from closing anything. Wattpad would show the
  // asterisks to every reader, so the writer hears about it here first.
  // A scene break is made of asterisks on purpose, and code keeps them.
  const stray = paragraphs
    .map((p, index) => ({ p, number: index + 1 }))
    .filter(
      ({ p }) => p.kind !== "break" && p.kind !== "code" && STRAY.test(p.text),
    )
    .map(({ number }) => number);
  if (stray.length > 0) {
    list.push({ kind: "stray", paragraphs: stray });
  }

  // Wattpad's own help centre says that an em dash can turn into a hyphen
  // when a story is published, and that there is no fix for it yet.
  const dashes = paragraphs.reduce(
    (count, p) => count + (p.text.match(/\u2014/g)?.length ?? 0),
    0,
  );
  if (dashes > 0) {
    list.push({ kind: "dash", count: dashes });
  }

  return list;
}
