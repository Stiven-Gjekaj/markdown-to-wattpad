import type { Notice } from "../convert";

/**
 * Says what a notice means, in the words the page shows.
 *
 * The converter reports facts, such as "two links lost their address". This
 * file turns each fact into one instruction that a writer can act on before
 * pasting, because a notice that only describes a problem leaves the writer
 * to guess the fix.
 */
export function describe(notice: Notice): string {
  switch (notice.kind) {
    case "image": {
      const named = notice.alts.filter((alt) => alt.trim() !== "");
      const which = named.length > 0 ? ` (${quoteList(named)})` : "";
      return `${count(notice.alts.length, "picture")}${which} left out. Wattpad takes a picture only as an upload. Add it in the Wattpad writer.`;
    }
    case "link":
      return `${count(notice.count, "link")} became plain text. Wattpad does not keep a link in the story text.`;
    case "strike":
      return `${count(notice.count, "strikethrough")} became plain text. Wattpad has no strikethrough.`;
    case "code":
      return `${count(notice.count, "piece")} of code became plain text.`;
    case "tag":
      return `HTML that Wattpad cannot show stays as visible text: ${notice.names
        .map((name) => `<${name}>`)
        .join(
          ", ",
        )}. Remove it from the Markdown if you do not want readers to see it.`;
    case "stray":
      return `${notice.paragraphs.length === 1 ? "Paragraph" : "Paragraphs"} ${numberList(notice.paragraphs)} still ${notice.paragraphs.length === 1 ? "shows" : "show"} asterisks. A bold or italic mark there has no partner. Readers would see the asterisks.`;
    case "dash":
      return `${count(notice.count, "em dash", "em dashes")} in the text. Wattpad can change an em dash to a hyphen when you publish.`;
  }
}

function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function quoteList(items: string[]): string {
  return items.map((item) => `"${item}"`).join(", ");
}

/** "3", "3 and 7", or "3, 7, and 12". Long lists stop after six. */
export function numberList(numbers: number[]): string {
  const shown = numbers.slice(0, 6).map(String);
  const more = numbers.length - shown.length;
  if (more > 0) {
    return `${shown.join(", ")}, and ${more} more`;
  }
  if (shown.length <= 2) {
    return shown.join(" and ");
  }
  return `${shown.slice(0, -1).join(", ")}, and ${shown[shown.length - 1]}`;
}
