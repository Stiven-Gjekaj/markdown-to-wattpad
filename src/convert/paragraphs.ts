import type { Block } from "./blocks";
import { type Found, type Line, type Run, readLines } from "./runs";
import { boldLabel, speakerOf } from "./speaker";

/**
 * Builds the paragraphs that Wattpad receives.
 *
 * Each published chapter of the story this tool was made for follows the same
 * layout, and these rules copy it:
 *
 * - Narration is centred, one Wattpad paragraph for each Markdown paragraph.
 * - Dialogue is aligned left, and a run of dialogue lines is one paragraph,
 *   with a line break between the speakers. The Markdown puts a blank line
 *   between those lines or it does not, and Wattpad shows the same block.
 */

export type Kind = "narration" | "dialogue" | "heading" | "break" | "code";

export interface Segment {
  kind: Kind;
  lines: Line[];
}

export interface Rules {
  /** Put a run of dialogue lines into one paragraph. */
  joinDialogue: boolean;
  /** Write a plain speaker label, such as "MSTR:", in bold. */
  boldSpeakers: boolean;
}

type Marks = Pick<Run, "bold" | "italic" | "underline">;

const HEADING_MARKS: Marks = { bold: true, italic: false, underline: false };

export function buildSegments(
  blocks: Block[],
  rules: Rules,
  found: Found,
): Segment[] {
  const segments: Segment[] = [];

  for (const piece of blocks) {
    switch (piece.kind) {
      case "heading":
        push(segments, "heading", styled([piece.text], HEADING_MARKS, found));
        break;
      case "break":
        push(segments, "break", [[plainRun(piece.text)]]);
        break;
      case "code": {
        const lines = piece.lines
          .filter((line) => line.trim() !== "")
          .map((line) => [plainRun(line.trim())]);
        if (lines.length > 0) {
          found.code += 1;
          push(segments, "code", lines);
        }
        break;
      }
      case "paragraph":
        segments.push(...paragraphSegments(piece.lines, rules, found));
        break;
    }
  }

  return rules.joinDialogue ? joinDialogue(segments) : segments;
}

function push(segments: Segment[], kind: Kind, lines: Line[]): void {
  if (lines.length > 0) {
    segments.push({ kind, lines });
  }
}

/** Reads each line alone and adds the given marks to every run in it. */
function styled(raw: string[], marks: Marks, found: Found): Line[] {
  return raw.flatMap((line) =>
    readLines(line, found).map((runs) =>
      runs.map((run) => ({
        ...run,
        bold: run.bold || marks.bold,
        italic: run.italic || marks.italic,
        underline: run.underline || marks.underline,
      })),
    ),
  );
}

/**
 * Splits one Markdown paragraph into narration and dialogue.
 *
 * The lines before the first speaker are narration, and they become a
 * centred paragraph of their own. From the first speaker on, the paragraph
 * is dialogue to its end. A line with no speaker after a speaker line stays
 * in the block: it is the rest of a long line that wrapped, or a short
 * action between two speakers, and the published chapters keep both inside
 * the dialogue block, on the left.
 */
function paragraphSegments(
  lines: string[],
  rules: Rules,
  found: Found,
): Segment[] {
  const first = lines.findIndex((line) => speakerOf(line) !== null);
  if (first === -1) {
    return narration(lines, found);
  }

  // Each line of dialogue is read alone. An asterisk that one speaker leaves
  // open must not put the next speaker in italics.
  const dialogue = lines.slice(first).flatMap((line) => {
    const speaker = speakerOf(line);
    const source =
      speaker && rules.boldSpeakers ? boldLabel(line, speaker) : line;
    return readLines(source, found);
  });

  const segments = narration(lines.slice(0, first), found);
  push(segments, "dialogue", dialogue);
  return segments;
}

/**
 * Reads narration as one piece, so that emphasis may run across a line
 * break, as it does in a poem set in italics.
 */
function narration(lines: string[], found: Found): Segment[] {
  const segments: Segment[] = [];
  if (lines.length > 0) {
    push(segments, "narration", readLines(lines.join("\n"), found));
  }
  return segments;
}

function joinDialogue(segments: Segment[]): Segment[] {
  const joined: Segment[] = [];
  for (const segment of segments) {
    const last = joined[joined.length - 1];
    if (segment.kind === "dialogue" && last?.kind === "dialogue") {
      last.lines.push(...segment.lines);
    } else {
      joined.push({ kind: segment.kind, lines: [...segment.lines] });
    }
  }
  return joined;
}

function plainRun(text: string): Run {
  return { text, bold: false, italic: false, underline: false };
}
