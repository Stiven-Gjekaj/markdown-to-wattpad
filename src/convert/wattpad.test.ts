import { describe, expect, it } from "vitest";
import type { Line } from "./runs";
import { escapeHtml, partHtml, partText, toParagraph } from "./wattpad";

const run = (text: string, marks = "") => ({
  text,
  bold: marks.includes("b"),
  italic: marks.includes("i"),
  underline: marks.includes("u"),
});

describe("writing a paragraph as Wattpad markup", () => {
  it("nests the tags bold, then italic, then underline", () => {
    const lines: Line[] = [
      [run("End of Chapter 9", "biu")],
      [run('"Name"', "biu")],
    ];
    const paragraph = toParagraph({ kind: "ending", lines }, "center");
    expect(paragraph.html).toBe(
      '<b><i><u>End of Chapter 9</u></i></b><br><b><i><u>"Name"</u></i></b>',
    );
    expect(paragraph.text).toBe('End of Chapter 9\n"Name"');
  });

  it("keeps a shared tag open across runs", () => {
    const paragraph = toParagraph(
      { kind: "dialogue", lines: [[run("NES ", "b"), run("says", "bi")]] },
      "left",
    );
    expect(paragraph.html).toBe("<b>NES <i>says</i></b>");
  });

  it("closes and reopens when the outer mark changes", () => {
    const paragraph = toParagraph(
      { kind: "narration", lines: [[run("a", "bi"), run("b", "i")]] },
      "center",
    );
    expect(paragraph.html).toBe("<b><i>a</i></b><i>b</i>");
  });

  it("escapes the text", () => {
    expect(escapeHtml("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
    const paragraph = toParagraph(
      { kind: "narration", lines: [[run("<script>", "")]] },
      "center",
    );
    expect(paragraph.html).toBe("&lt;script&gt;");
  });
});

describe("writing a whole part", () => {
  const paragraphs = [
    toParagraph({ kind: "narration", lines: [[run("One.")]] }, "center"),
    toParagraph(
      {
        kind: "dialogue",
        lines: [
          [run("NES", "b"), run(": Hi.")],
          [run("BRR", "b"), run(": Hello.")],
        ],
      },
      "left",
    ),
  ];

  it("writes each paragraph with its alignment and nothing else", () => {
    expect(partHtml(paragraphs)).toBe(
      '<p style="text-align:center;">One.</p>' +
        '<p style="text-align:left;"><b>NES</b>: Hi.<br><b>BRR</b>: Hello.</p>',
    );
  });

  it("writes plain text with a blank line between paragraphs", () => {
    expect(partText(paragraphs)).toBe("One.\n\nNES: Hi.\nBRR: Hello.");
  });
});
