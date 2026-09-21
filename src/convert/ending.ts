import type { Block } from "./blocks";

/**
 * Finds the end of a chapter.
 *
 * Every chapter of the story this tool serves closes the same way:
 *
 *     ***End of Chapter 344***
 *     ***"She Never Asked"***
 *
 *     [ Absolution is a conversation. She refused to have it, ... ]
 *
 * On Wattpad the first two lines are one centred paragraph, in bold italic,
 * underlined. The closing thought in square brackets is one centred
 * paragraph in bold, even when the Markdown spreads it over several
 * paragraphs, and even when the Markdown leaves it plain.
 *
 * These lines are also where hand written Markdown goes wrong most often.
 * The published chapters hold `***End of Chapter 205 ***`, with a space that
 * stops the marks from closing, and `*E****nd of Chapter 228***`. Each one is
 * bold italic on Wattpad. Every line in this block is set in its style from
 * end to end, so the marks around it carry no meaning, and they are removed
 * here instead of being shown to the reader.
 */

export type Piece =
  | Block
  | { kind: "ending"; lines: string[] }
  | { kind: "closing"; lines: string[] };

const UNITS =
  "chapter|volume|part|book|act|arc|season|prologue|epilogue|interlude";
const ENDING_LOOSE = new RegExp(`^end of (?:${UNITS})\\b`, "i");
const ENDING_STRICT = new RegExp(
  `^end of (?:${UNITS})(?:\\s+[\\p{L}\\p{N}.:#-]+)?[.!]?$`,
  "iu",
);
const WRAPPED = /^([*_]+)[ \t]*(.*?)[ \t]*[*_]+$/;
const NAME_AFTER = new RegExp(
  `^(end of (?:${UNITS})(?:\\s+[\\p{L}\\p{N}.:#-]+)?)\\s+(["\\u201c].*)$`,
  "iu",
);
const QUOTED = /^["\u201c].*["\u201d]$/;

/** The most paragraphs that one closing thought may span. */
const CLOSING_MAX = 8;

/**
 * Takes away the marks around a line, and any run of two or more asterisks
 * left inside it.
 *
 * The marks at the two ends are taken away one end at a time, because an
 * emphasis run can open on one line and close on the next:
 *
 *     *E**nd of Chapter 228
 *     "Leah"***
 */
export function unwrap(raw: string): string {
  const match = WRAPPED.exec(raw);
  const inner = match && match[2] !== "" ? match[2] : raw;
  return inner
    .replace(/^[*_]+/, "")
    .replace(/[*_]+$/, "")
    .replace(/\*{2,}/g, "")
    .trim();
}

function isWrapped(raw: string): boolean {
  const match = WRAPPED.exec(raw);
  return match !== null && match[2] !== "";
}

/**
 * True for "End of Chapter 243" and its kin.
 *
 * A line in bold or italic may say more after the number. A plain line must
 * say nothing more, so that a sentence such as "End of chapter meetings were
 * tense." stays prose.
 */
export function isEndingLine(raw: string): boolean {
  const text = unwrap(raw);
  return isWrapped(raw) ? ENDING_LOOSE.test(text) : ENDING_STRICT.test(text);
}

/** The name of the chapter, on the line after "End of Chapter". */
function isNameLine(raw: string): boolean {
  const text = unwrap(raw);
  if (text === "" || text.startsWith("[") || isEndingLine(raw)) {
    return false;
  }
  return isWrapped(raw) || QUOTED.test(text);
}

function opensBracket(raw: string): boolean {
  return unwrap(raw).startsWith("[");
}

function closesBracket(raw: string): boolean {
  return unwrap(raw).endsWith("]");
}

/** Replaces each chapter ending in the list with its own pieces. */
export function findEndings(blocks: Block[]): Piece[] {
  const out: Piece[] = [];
  const pending: Block[] = blocks.map((block) =>
    block.kind === "paragraph" ? { ...block, lines: [...block.lines] } : block,
  );

  while (pending.length > 0) {
    const block = pending.shift() as Block;
    const at =
      block.kind === "paragraph" ? block.lines.findIndex(isEndingLine) : -1;
    if (block.kind !== "paragraph" || at === -1) {
      out.push(block);
      continue;
    }

    if (at > 0) {
      out.push({ kind: "paragraph", lines: block.lines.slice(0, at) });
    }

    const ending = [block.lines[at]];
    let rest = block.lines.slice(at + 1);
    if (rest.length > 0 && isNameLine(rest[0])) {
      ending.push(rest[0]);
      rest = rest.slice(1);
    } else if (rest.length === 0) {
      // A blank line between the two lines puts the name in the next
      // paragraph. Take it only when that paragraph is the name and nothing
      // else.
      const next = pending[0];
      if (
        next?.kind === "paragraph" &&
        next.lines.length === 1 &&
        isNameLine(next.lines[0])
      ) {
        ending.push(next.lines[0]);
        pending.shift();
      }
    }
    const lines = ending.map(unwrap);
    // "End of Chapter 191" and the name can share one line in the Markdown.
    // Wattpad shows them as two, so they are cut apart when there is no name
    // line already.
    const shared = lines.length === 1 ? NAME_AFTER.exec(lines[0]) : null;
    out.push({
      kind: "ending",
      lines: shared ? [shared[1], shared[2]] : lines,
    });

    if (rest.length > 0) {
      pending.unshift({ kind: "paragraph", lines: rest });
    }

    const closing = takeClosing(pending);
    if (closing) {
      out.push({ kind: "closing", lines: closing.map(unwrap) });
    }
  }

  return out;
}

/**
 * Takes the closing thought off the front of the list, when it is there.
 *
 * It runs from a line that opens with "[" to a line that closes with "]".
 * When no line closes it within a few paragraphs, or a heading or a scene
 * break comes first, it is not a closing thought, and the list is left as it
 * was.
 */
function takeClosing(pending: Block[]): string[] | null {
  const first = pending[0];
  if (first?.kind !== "paragraph" || !opensBracket(first.lines[0])) {
    return null;
  }

  const lines: string[] = [];
  for (
    let index = 0;
    index < pending.length && index < CLOSING_MAX;
    index += 1
  ) {
    const block = pending[index];
    if (block.kind !== "paragraph") {
      return null;
    }
    for (let line = 0; line < block.lines.length; line += 1) {
      lines.push(block.lines[line]);
      if (closesBracket(block.lines[line])) {
        const remainder = block.lines.slice(line + 1);
        pending.splice(
          0,
          index + 1,
          ...(remainder.length > 0
            ? [{ kind: "paragraph" as const, lines: remainder }]
            : []),
        );
        return lines;
      }
    }
  }
  return null;
}
