import { describe, expect, it } from "vitest";
import { convert, countWords, DEFAULTS } from "./index";

/**
 * A short chapter in the layout that the published chapters use. The words
 * are written for this test. They come from no chapter.
 */
const CHAPTER = `# (Chapter 12 || Volume 2) The Lamp.

The rain had stopped by the time she reached the mill. The door stood open, as it always did, and the lamp inside was *already* lit.

**MAR**: You came.

**TOM**: I said I would.

**MAR**: You say a lot of things.

He set the letter on the table and waited.

***End of Chapter 12***

***"The Lamp"***

[ Some promises are kept by showing up. ]
`;

const EXPECTED =
  '<p style="text-align:center;">The rain had stopped by the time she ' +
  "reached the mill. The door stood open, as it always did, and the lamp " +
  "inside was <i>already</i> lit.</p>" +
  '<p style="text-align:left;"><b>MAR</b>: You came.<br><b>TOM</b>: I said ' +
  "I would.<br><b>MAR</b>: You say a lot of things.</p>" +
  '<p style="text-align:center;">He set the letter on the table and ' +
  "waited.</p>" +
  '<p style="text-align:center;"><b><i><u>End of Chapter 12</u></i></b><br>' +
  '<b><i><u>"The Lamp"</u></i></b></p>' +
  '<p style="text-align:center;"><b>[ Some promises are kept by showing ' +
  "up. ]</b></p>";

describe("converting a chapter", () => {
  it("writes the layout of a published chapter", () => {
    const result = convert(CHAPTER);
    expect(result.title).toBe("(Chapter 12 || Volume 2) The Lamp.");
    expect(result.html).toBe(EXPECTED);
  });

  it("gives the same part for the other way of writing it", () => {
    // Front matter, speakers on single lines, and the ending in one
    // paragraph: the shape that a copy downloaded from Wattpad has.
    const other = [
      "---",
      'title: "(Chapter 12 || Volume 2) The Lamp."',
      'chapter: "12"',
      "---",
      "",
      "The rain had stopped by the time she reached the mill. The door stood open, as it always did, and the lamp inside was *already* lit.",
      "",
      "**MAR**: You came.",
      "**TOM**: I said I would.",
      "**MAR**: You say a lot of things.",
      "",
      "He set the letter on the table and waited.",
      "",
      "***End of Chapter 12***",
      '***"The Lamp"***',
      "",
      "**[ Some promises are kept by showing up. ]**",
    ].join("\n");
    const result = convert(other);
    expect(result.title).toBe("(Chapter 12 || Volume 2) The Lamp.");
    expect(result.html).toBe(EXPECTED);
  });

  it("writes the same paragraphs as plain text", () => {
    expect(convert(CHAPTER).text).toBe(
      [
        "The rain had stopped by the time she reached the mill. The door stood open, as it always did, and the lamp inside was already lit.",
        "MAR: You came.\nTOM: I said I would.\nMAR: You say a lot of things.",
        "He set the letter on the table and waited.",
        'End of Chapter 12\n"The Lamp"',
        "[ Some promises are kept by showing up. ]",
      ].join("\n\n"),
    );
  });

  it("does not repeat the title in the body", () => {
    expect(convert(CHAPTER).html).not.toContain("Volume 2");
  });

  it("keeps a heading that is not the first line in the body", () => {
    const result = convert("Opening line.\n\n# Later heading");
    expect(result.title).toBe("");
    expect(result.html).toBe(
      '<p style="text-align:center;">Opening line.</p>' +
        '<p style="text-align:center;"><b>Later heading</b></p>',
    );
  });

  it("puts narration on the left when told to", () => {
    const result = convert("Prose.\n\n**A**: Line.", {
      ...DEFAULTS,
      narration: "left",
    });
    expect(result.paragraphs.map((p) => p.align)).toEqual(["left", "left"]);
  });

  it("gives an empty part for empty text", () => {
    const result = convert("  \n\n ");
    expect(result).toMatchObject({ title: "", html: "", text: "", words: 0 });
    expect(result.notices).toEqual([]);
  });

  it("counts the words", () => {
    expect(convert(CHAPTER).words).toBe(countWords(convert(CHAPTER).text));
    expect(countWords("One two, three.")).toBe(3);
    expect(countWords("- * * * \u2014")).toBe(0);
  });
});

describe("reporting what Wattpad cannot hold", () => {
  it("names each kind once", () => {
    const { notices } = convert(
      [
        "![The map](map.png)",
        "A [link](https://example.com) and ~~a strike~~ and `code`.",
        "An <ERROR> tag and an em dash \u2014 here.",
      ].join("\n\n"),
    );
    expect(notices).toEqual([
      { kind: "image", alts: ["The map"] },
      { kind: "link", count: 1 },
      { kind: "strike", count: 1 },
      { kind: "code", count: 1 },
      { kind: "tag", names: ["error"] },
      { kind: "dash", count: 1 },
    ]);
  });

  it("names the paragraphs that still show asterisks", () => {
    const { notices } = convert(
      "Clean.\n\nBroken ** here.\n\n* * *\n\nAlso *clean*.",
    );
    expect(notices).toEqual([{ kind: "stray", paragraphs: [2] }]);
  });

  it("says nothing about a clean chapter", () => {
    expect(convert(CHAPTER).notices).toEqual([]);
  });
});
