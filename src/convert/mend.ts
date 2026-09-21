/**
 * Mends bold and italic marks that a converter broke.
 *
 * Many tools that turn a document into Markdown copy the space at the edge
 * of an italic run inside the marks, so `<i>Wouldn't anyone? </i>Still`
 * becomes `*Wouldn't anyone? *Still`. CommonMark will not close a run on a
 * mark that has a space before it, so the reader sees two asterisks and no
 * italics. The chapters that this tool was tested on hold three shapes of
 * this fault, and each function below mends one of them.
 *
 * None of this runs on text that reads cleanly. readLines in runs.ts tries a
 * mended copy only when asterisks are left over, and keeps it only when none
 * are left.
 */

const SPACE = "[ \\t\\u00a0]";
const ONLY_SPACE = new RegExp(`^${SPACE}+$`);

/**
 * The copies to try, in order. Each one adds a repair to the one before, so
 * the first copy that reads cleanly is the smallest change that works.
 */
export function mendings(text: string): string[] {
  const empty = dropEmptyBold(text);
  const paired = moveSpaces(empty);
  const joined = joinItalics(empty);
  const both = moveSpaces(joined);
  const seen = new Set<string>([text]);
  return [empty, paired, joined, both].filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }
    seen.add(candidate);
    return true;
  });
}

/**
 * Removes a bold run that holds only a space.
 *
 *     **OFC**:** **This is irreversible.
 *
 * An editor leaves `** **` behind when bold is switched on and off again at
 * one place. It shows nothing on Wattpad, so it shows nothing here.
 *
 * The same four asterisks sit between two bold words in "**a** **b**", where
 * they close one run and open the next. So the runs are paired first, in
 * order, and only a pair that holds nothing but a space is removed.
 */
export function dropEmptyBold(text: string): string {
  const parts = text.split(/(\*+)/);
  let opener = -1;
  for (let index = 1; index < parts.length; index += 2) {
    if (parts[index] !== "**" || parts[index - 1].endsWith("\\")) {
      continue;
    }
    if (opener === -1) {
      opener = index;
      continue;
    }
    const inside = parts.slice(opener + 1, index).join("");
    if (ONLY_SPACE.test(inside)) {
      parts[opener] = "";
      parts[index] = "";
    }
    opener = -1;
  }
  return parts.join("");
}

/**
 * Moves a space from inside a pair of marks to outside it.
 *
 *     reminded **Johann **of fire   ->   reminded **Johann** of fire
 *     Your* imagination *truly      ->   Your *imagination* truly
 *
 * An opening mark and a closing mark look the same when each has a space
 * on one side, so only their order tells them apart. The first run of a
 * given length on the line opens and the next one closes. A closing run with
 * a space before it and a word after it gets the space moved after it. An
 * opening run with a word before it and a space after it gets the space
 * moved before it.
 */
export function moveSpaces(text: string): string {
  // The odd places hold each run of asterisks, whole. The even places hold
  // the text between them, which may be empty.
  const parts = text.split(/(\*+)/);
  const open = new Map<number, boolean>();

  for (let index = 1; index < parts.length; index += 2) {
    const run = parts[index];
    const before = parts[index - 1];
    const after = parts[index + 1];
    // An escaped asterisk is text. A run longer than three is no single
    // mark, as in "f****" or "******2", so it takes no part in the pairing.
    if (run.length > 3 || before.endsWith("\\")) {
      continue;
    }

    const opening = !(open.get(run.length) ?? false);
    open.set(run.length, opening);

    const spaceBefore = /\s$/.test(before);
    const spaceAfter = /^\s/.test(after);
    const wordBefore = before !== "" && !spaceBefore;
    const wordAfter = after !== "" && !spaceAfter;

    if (!opening && spaceBefore && (wordAfter || after === "")) {
      const space = /\s+$/.exec(before)?.[0] ?? "";
      parts[index - 1] = before.slice(0, before.length - space.length);
      parts[index + 1] = space + after;
    } else if (opening && spaceAfter && (wordBefore || before === "")) {
      const space = /^\s+/.exec(after)?.[0] ?? "";
      parts[index - 1] = before + space;
      parts[index + 1] = after.slice(space.length);
    }
  }

  return parts.join("");
}

/**
 * Joins two italic runs that a converter wrote side by side.
 *
 *     *Then the powder arrived. **But not long enough.*
 *
 * The middle `**` is not bold. It is the end of one italic run and the start
 * of the next, written with the space inside the first. Removing it gives
 * one italic run, which is what a reader of the original saw.
 */
export function joinItalics(text: string): string {
  return text.replace(new RegExp(`(\\S)(${SPACE})\\*\\*(?=\\S)`, "g"), "$1$2");
}
