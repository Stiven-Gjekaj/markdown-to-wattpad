import { Lexer, type Token } from "marked";
import { mendings } from "./mend";

/**
 * Reads inline Markdown into runs of text.
 *
 * A run is text with three marks: bold, italic, and underline. Those are the
 * only three that Wattpad keeps. Markdown nests emphasis as a tree, but a run
 * is flat, and that is the point: a tree lets `<b>` open inside `<u>` and
 * close outside it, and a flat list of runs cannot say that. The markup is
 * written from the runs afterwards, in one fixed order, so it is always well
 * formed.
 *
 * marked does the reading, because the rules for asterisks are the hard part
 * of Markdown and marked already follows the CommonMark rules for them.
 */

export interface Run {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/** One line of a paragraph. Wattpad joins lines with a line break. */
export type Line = Run[];

/** What the reader met that Wattpad cannot hold. */
export interface Found {
  /** The alt text of each picture, or "" when a picture has none. */
  images: string[];
  /** Links whose address is lost, because only the text stays. */
  links: number;
  /** Strikethrough runs, which Wattpad cannot show. */
  struck: number;
  /** Code spans and code blocks, which become plain text. */
  code: number;
  /** HTML tags that are kept as visible text. */
  tags: string[];
}

export function emptyFound(): Found {
  return { images: [], links: 0, struck: 0, code: 0, tags: [] };
}

interface Marks {
  bold: number;
  italic: number;
  underline: number;
}

type Piece = Run | "break";

const OPTIONS = { gfm: true, breaks: true } as const;

/**
 * Reads a piece of inline Markdown, which may hold line breaks.
 *
 * When the text comes out with asterisks still in it, the marks were broken
 * before they arrived, and a mended copy is tried. See mend.ts. The mended
 * copy is used only when it reads with no asterisks left at all. A repair
 * that removes some of them and not the rest is a guess, and the original
 * shows the writer exactly what went wrong.
 */
export function readLines(markdown: string, found: Found): Line[] {
  let best = read(markdown);
  if (hasStray(best.lines)) {
    for (const candidate of mendings(markdown)) {
      const attempt = read(candidate);
      if (!hasStray(attempt.lines)) {
        best = attempt;
        break;
      }
    }
  }
  found.images.push(...best.found.images);
  found.links += best.found.links;
  found.struck += best.found.struck;
  found.code += best.found.code;
  found.tags.push(...best.found.tags);
  return best.lines;
}

function read(markdown: string): { lines: Line[]; found: Found } {
  const pieces: Piece[] = [];
  const found = emptyFound();
  walk(Lexer.lexInline(markdown, OPTIONS), newMarks(), pieces, found);
  return { lines: splitLines(pieces), found };
}

/**
 * An asterisk that a reader would see and that is not part of a word.
 *
 * "f*ck" keeps its asterisk on purpose, and "5 * 3" is arithmetic. Two
 * asterisks together, or one against the start or the end of a word, are a
 * bold or italic mark that did not find its partner.
 */
export const STRAY = /\*\*|(^|\s)\*\S|\S\*(\s|$)/;

function hasStray(lines: Line[]): boolean {
  return lines.some((line) => STRAY.test(textOf(line)));
}

function newMarks(): Marks {
  return { bold: 0, italic: 0, underline: 0 };
}

function push(pieces: Piece[], text: string, marks: Marks): void {
  if (text === "") {
    return;
  }
  pieces.push({
    text,
    bold: marks.bold > 0,
    italic: marks.italic > 0,
    underline: marks.underline > 0,
  });
}

function walk(
  tokens: Token[],
  marks: Marks,
  pieces: Piece[],
  found: Found,
): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        push(pieces, decodeEntities(token.text), marks);
        break;
      case "escape":
        push(pieces, token.text, marks);
        break;
      case "strong":
        marks.bold += 1;
        walk(token.tokens ?? [], marks, pieces, found);
        marks.bold -= 1;
        break;
      case "em":
        marks.italic += 1;
        walk(token.tokens ?? [], marks, pieces, found);
        marks.italic -= 1;
        break;
      case "del":
        // GFM reads one tilde as well as two. A single tilde is common in
        // fiction ("Hey~ what's up~"), so only two of them count as
        // strikethrough. Anything else is put back as the writer typed it.
        if (token.raw.startsWith("~~")) {
          found.struck += 1;
          walk(token.tokens ?? [], marks, pieces, found);
        } else {
          push(pieces, "~", marks);
          walk(token.tokens ?? [], marks, pieces, found);
          push(pieces, "~", marks);
        }
        break;
      case "codespan":
        found.code += 1;
        push(pieces, decodeEntities(token.text), marks);
        break;
      case "br":
        pieces.push("break");
        break;
      case "link": {
        const before = pieces.length;
        walk(token.tokens ?? [], marks, pieces, found);
        const text = pieces
          .slice(before)
          .map((piece) => (piece === "break" ? "" : piece.text))
          .join("");
        if (!sameAddress(text, token.href)) {
          found.links += 1;
        }
        break;
      }
      case "image":
        found.images.push(token.text);
        break;
      case "html":
        tag(token.text, marks, pieces, found);
        break;
      default:
        push(pieces, token.raw, marks);
    }
  }
}

const TAG = /^<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>$/i;

const MARK_TAGS: Record<string, keyof Marks> = {
  b: "bold",
  strong: "bold",
  i: "italic",
  em: "italic",
  u: "underline",
  ins: "underline",
};

/**
 * Handles an HTML tag inside the Markdown.
 *
 * Markdown has no underline, and Wattpad does, so `<u>` is the one way to
 * write it. The bold and italic tags work as well. A tag that Wattpad cannot
 * hold is not deleted: it stays in the text, so the writer sees it in the
 * preview instead of losing words in silence.
 */
function tag(raw: string, marks: Marks, pieces: Piece[], found: Found): void {
  if (raw.startsWith("<!--")) {
    return;
  }
  const match = TAG.exec(raw.trim());
  const name = match?.[2].toLowerCase() ?? "";
  const closing = match?.[1] === "/";

  if (name === "br") {
    pieces.push("break");
    return;
  }
  const mark = MARK_TAGS[name];
  if (mark) {
    marks[mark] = closing ? Math.max(0, marks[mark] - 1) : marks[mark] + 1;
    return;
  }
  if (name === "s" || name === "del" || name === "strike") {
    if (!closing) {
      found.struck += 1;
    }
    return;
  }
  found.tags.push(match ? name : raw);
  push(pieces, raw, marks);
}

function sameAddress(text: string, href: string): boolean {
  const bare = href.replace(/^(https?:\/\/|mailto:)/i, "");
  return text === href || text === bare;
}

function splitLines(pieces: Piece[]): Line[] {
  const lines: Line[] = [[]];
  for (const piece of pieces) {
    if (piece === "break") {
      lines.push([]);
    } else {
      lines[lines.length - 1].push(piece);
    }
  }
  return lines.map(tidy).filter((line) => line.length > 0);
}

/**
 * Joins runs that carry the same marks, and trims the ends of the line.
 *
 * Joining matters for the output, not only for its size. Two bold runs side
 * by side are one word to a reader, and a later step that asks whether a
 * line is bold from end to end must not be fooled by where marked happened
 * to cut the text.
 */
function tidy(line: Line): Line {
  const joined: Line = [];
  for (const run of line) {
    const last = joined[joined.length - 1];
    if (last && sameMarks(last, run)) {
      last.text += run.text;
    } else if (
      // A space between two runs with the same marks looks the same with the
      // marks or without them, so "*one.* *Two.*" becomes one italic run.
      joined.length >= 2 &&
      last.text.trim() === "" &&
      sameMarks(joined[joined.length - 2], run)
    ) {
      joined.pop();
      joined[joined.length - 1].text += last.text + run.text;
    } else {
      joined.push({ ...run });
    }
  }
  while (joined.length > 0 && joined[0].text.trimStart() === "") {
    joined.shift();
  }
  while (joined.length > 0 && joined[joined.length - 1].text.trimEnd() === "") {
    joined.pop();
  }
  if (joined.length > 0) {
    joined[0].text = joined[0].text.trimStart();
    const end = joined.length - 1;
    joined[end].text = joined[end].text.trimEnd();
  }
  return joined;
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
};

/**
 * Turns an entity such as `&amp;` into its character.
 *
 * marked leaves entities as they are in a text token. CommonMark says that
 * an entity stands for its character, so "&amp;" in the Markdown must reach
 * Wattpad as "&". A name that is not in the list stays as it was typed.
 */
export function decodeEntities(text: string): string {
  return text.replace(
    /&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/g,
    (whole, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? Number.parseInt(body.slice(2), 16)
            : Number.parseInt(body.slice(1), 10);
        const valid =
          code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff);
        return valid ? String.fromCodePoint(code) : whole;
      }
      return NAMED[body] ?? whole;
    },
  );
}

/** True when every visible run of the line is both bold and italic. */
export function isBoldItalic(line: Line): boolean {
  const visible = line.filter((run) => run.text.trim() !== "");
  return visible.length > 0 && visible.every((run) => run.bold && run.italic);
}

/** The text of a line, without marks. */
export function textOf(line: Line): string {
  return line.map((run) => run.text).join("");
}

function sameMarks(a: Run, b: Run): boolean {
  return (
    a.bold === b.bold && a.italic === b.italic && a.underline === b.underline
  );
}
