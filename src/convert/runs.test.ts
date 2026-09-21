import { describe, expect, it } from "vitest";
import {
  decodeEntities,
  emptyFound,
  isBoldItalic,
  type Line,
  readLines,
  textOf,
} from "./runs";

const plain = (text: string) => ({
  text,
  bold: false,
  italic: false,
  underline: false,
});

function read(markdown: string): Line[] {
  return readLines(markdown, emptyFound());
}

describe("reading inline Markdown into runs", () => {
  it("reads a speaker label as a bold run", () => {
    expect(read("**NES**: There's some left.")).toEqual([
      [
        { text: "NES", bold: true, italic: false, underline: false },
        plain(": There's some left."),
      ],
    ]);
  });

  it("reads three asterisks as bold and italic", () => {
    const [line] = read("***End of Chapter 243***");
    expect(line).toEqual([
      {
        text: "End of Chapter 243",
        bold: true,
        italic: true,
        underline: false,
      },
    ]);
    expect(isBoldItalic(line)).toBe(true);
  });

  it("cuts a line at each line break, and keeps emphasis across it", () => {
    const lines = read("*Roses are red\nViolets are blue*");
    expect(lines.map(textOf)).toEqual(["Roses are red", "Violets are blue"]);
    expect(lines.every((line) => line.every((run) => run.italic))).toBe(true);
  });

  it("reads <u> as underline, and the bold and italic tags too", () => {
    const [line] = read(
      "<u>a</u> <b>b</b> <i>c</i> <strong><em>d</em></strong>",
    );
    expect(line.filter((run) => run.underline).map((run) => run.text)).toEqual([
      "a",
    ]);
    expect(line.find((run) => run.text === "b")?.bold).toBe(true);
    expect(line.find((run) => run.text === "c")?.italic).toBe(true);
    const d = line.find((run) => run.text === "d");
    expect(d?.bold && d.italic).toBe(true);
  });

  it("joins runs that carry the same marks", () => {
    // marked cuts "a*b*c" into three tokens. The bold around all of it makes
    // them one run, which is what a reader sees.
    expect(read("**a*b*c**")).toEqual([
      [
        { text: "a", bold: true, italic: false, underline: false },
        { text: "b", bold: true, italic: true, underline: false },
        { text: "c", bold: true, italic: false, underline: false },
      ],
    ]);
    // The space between two bold runs looks the same in bold or not, so the
    // two runs and the space become one.
    expect(read("**one** **two**")).toEqual([
      [{ text: "one two", bold: true, italic: false, underline: false }],
    ]);
    expect(read("<b>one</b><b>two</b>")).toEqual([
      [{ text: "onetwo", bold: true, italic: false, underline: false }],
    ]);
  });

  it("turns an entity into its character", () => {
    expect(textOf(read("Tom &amp; Jerry &#8212; &#x2019; &bogus;")[0])).toBe(
      "Tom & Jerry \u2014 \u2019 &bogus;",
    );
  });

  it("keeps a backslash escape as the character", () => {
    expect(read("\\*not italic\\*")).toEqual([[plain("*not italic*")]]);
  });

  it("mends a closing mark that has a space before it", () => {
    // CommonMark will not close on "** " and shows the asterisks. The
    // published chapters hold this shape, and Wattpad shows it in bold.
    expect(read("**[Volume 7] **")).toEqual([
      [{ text: "[Volume 7]", bold: true, italic: false, underline: false }],
    ]);
  });

  it("keeps asterisks that no repair can place", () => {
    expect(textOf(read("a ** b")[0])).toBe("a ** b");
  });

  it("keeps a single tilde, and removes two", () => {
    const found = emptyFound();
    expect(textOf(readLines("Hey~there~ and ~~gone~~", found)[0])).toBe(
      "Hey~there~ and gone",
    );
    expect(found.struck).toBe(1);
  });

  it("keeps the text of a link and counts the lost address", () => {
    const found = emptyFound();
    const [line] = readLines(
      "[the map](https://example.com/map) and https://example.com",
      found,
    );
    expect(textOf(line)).toBe("the map and https://example.com");
    expect(found.links).toBe(1);
  });

  it("drops a picture and records its alt text", () => {
    const found = emptyFound();
    const lines = readLines("![The old map](map.png)", found);
    expect(lines).toEqual([]);
    expect(found.images).toEqual(["The old map"]);
  });

  it("keeps an unknown tag as visible text", () => {
    const found = emptyFound();
    expect(textOf(readLines("An <ERROR> here", found)[0])).toBe(
      "An <ERROR> here",
    );
    expect(found.tags).toEqual(["error"]);
  });

  it("reads code as plain text", () => {
    const found = emptyFound();
    expect(read("`**not bold**`")).toEqual([[plain("**not bold**")]]);
    readLines("`x`", found);
    expect(found.code).toBe(1);
  });

  it("drops empty lines and trims the ends", () => {
    expect(read("  one  \n\n<br>\n two ").map(textOf)).toEqual(["one", "two"]);
  });

  it("does not take a partly italic line for bold and italic", () => {
    expect(isBoldItalic(read("***End*** of it")[0])).toBe(false);
    expect(isBoldItalic(read("**bold only**")[0])).toBe(false);
  });
});

describe("decoding entities", () => {
  it("refuses a code point that does not exist", () => {
    expect(decodeEntities("&#xD800; &#0; &#1114112;")).toBe(
      "&#xD800; &#0; &#1114112;",
    );
  });
});
