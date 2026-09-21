/**
 * Prepares the text that a writer pastes or opens.
 *
 * A chapter arrives from many editors. Windows writes CRLF, some editors put
 * a byte order mark at the start, and a chapter kept in a static site or a
 * notes vault often opens with YAML front matter. None of that is story text,
 * so it goes before any other step looks at the lines.
 */

export interface Source {
  /** The text, with LF line endings, no byte order mark, and no front matter. */
  body: string;
  /** The title that the front matter names, or "" when it names none. */
  title: string;
}

const FRONT_MATTER = /^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/;
const KEY_LINE = /^([A-Za-z_][\w-]*)[ \t]*:/;
const COMMENT = /<!--[\s\S]*?-->/g;

export function readSource(input: string): Source {
  let body = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  let title = "";

  const front = FRONT_MATTER.exec(body);
  if (front && isFrontMatter(front[1])) {
    title = titleIn(front[1]);
    body = body.slice(front[0].length);
  }

  // A comment is a note that the writer keeps for themselves. Markdown shows
  // nothing for it, so Wattpad must receive nothing for it either. It goes
  // here, before the lines are split, because a comment can span a blank line
  // and would otherwise cut one paragraph into two.
  body = removeComments(body);

  return { body, title };
}

/**
 * Removes comments until none is left.
 *
 * One pass is not enough. In "<!<!-- a -->-- b -->" the first pass removes
 * the inner comment, and the two halves around it join into a new one. The
 * converter escapes every character before it writes any markup, so a
 * leftover "<!--" could only ever show as text. It must not show at all.
 */
function removeComments(text: string): string {
  let before = "";
  let after = text;
  while (after !== before) {
    before = after;
    after = before.replace(COMMENT, "");
  }
  return after;
}

/**
 * Tells front matter from a chapter that opens with a scene break.
 *
 * Both start with a line of three hyphens. A chapter can open with a break,
 * a few lines, and a second break, and taking those lines for front matter
 * deletes story text in silence. So every line must look like a YAML key, a
 * list item, or a continuation, and at least one key must start in lower
 * case. A speaker line such as "NES: Hello" looks like a key, but no speaker
 * label in this format is written in lower case.
 */
function isFrontMatter(block: string): boolean {
  let lowerKey = false;
  for (const line of block.split("\n")) {
    if (line.trim() === "" || /^[ \t]/.test(line) || /^-[ \t]/.test(line)) {
      continue;
    }
    const key = KEY_LINE.exec(line);
    if (!key) {
      return false;
    }
    if (/^[a-z_]/.test(key[1])) {
      lowerKey = true;
    }
  }
  return lowerKey;
}

function titleIn(block: string): string {
  const line = /^title[ \t]*:[ \t]*(.*)$/m.exec(block);
  if (!line) {
    return "";
  }
  const value = line[1].trim();
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\(["\\])/g, "$1");
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}
