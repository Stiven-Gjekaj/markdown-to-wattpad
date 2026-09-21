/**
 * Cuts a chapter into blocks.
 *
 * This is not a full Markdown block parser, and that is deliberate. Wattpad
 * holds paragraphs and nothing else, and a chapter is prose, so the rules
 * here follow what a writer means rather than what CommonMark says:
 *
 * - A blank line starts a new paragraph. A single line break stays a line
 *   break. Dialogue in this format is one speaker to a line, and joining
 *   those lines into one run of text would destroy it.
 * - Leading spaces mean nothing. CommonMark reads a paragraph indented by
 *   four spaces as code, and many writers indent every paragraph.
 * - A line that starts with "-", "*", "+" or a number stays text. CommonMark
 *   makes it a list, which turns "- Jess Kalm" under an epigraph into a
 *   bullet, and a sentence that opens with "1990." into a numbered list.
 * - A line of three hyphens is a scene break, even directly under a line of
 *   text. CommonMark makes that line a heading.
 *
 * What stays from Markdown: ATX headings, scene breaks, fenced code, and the
 * quote marker, which is removed.
 */

export type Block =
  | { kind: "heading"; depth: number; text: string }
  | { kind: "break"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "paragraph"; lines: string[] };

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const BREAK = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>[ \t]?/;

export function readBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.split("\n");
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", lines: paragraph });
      paragraph = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index];

    const fence = FENCE.exec(line);
    if (fence) {
      flush();
      const marker = fence[1];
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !closes(lines[index], marker)) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ kind: "code", lines: code });
      continue;
    }

    while (QUOTE.test(line)) {
      line = line.replace(QUOTE, "");
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        depth: heading[1].length,
        text: (heading[2] ?? "").trim(),
      });
      continue;
    }

    if (BREAK.test(line)) {
      flush();
      blocks.push({ kind: "break", text: line.trim() });
      continue;
    }

    paragraph.push(line.trim());
  }

  flush();
  return blocks;
}

/** A fence closes on the same character, at least as many times, alone. */
function closes(line: string, marker: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length >= marker.length &&
    trimmed === marker[0].repeat(trimmed.length)
  );
}
