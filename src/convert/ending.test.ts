import { describe, expect, it } from "vitest";
import type { Block } from "./blocks";
import { findEndings, isEndingLine, unwrap } from "./ending";

const paragraph = (...lines: string[]): Block => ({ kind: "paragraph", lines });

describe("finding the line that ends a chapter", () => {
  it("reads the forms that the published chapters use", () => {
    for (const line of [
      "***End of Chapter 243***",
      "***END OF CHAPTER ******2***",
      "***End of Chapter 205 ***",
      "*E****nd of Chapter 228***",
      "***End Of Chapter 33***",
      "***End of Volume 7***",
      "End of Chapter 12",
      "**End of Chapter 12**",
    ]) {
      expect(isEndingLine(line), line).toBe(true);
    }
  });

  it("does not read a sentence as an ending", () => {
    for (const line of [
      "End of chapter meetings were always tense.",
      "It was the end of chapter one of her life.",
      "***The End***",
    ]) {
      expect(isEndingLine(line), line).toBe(false);
    }
  });
});

describe("taking the marks off a line", () => {
  it("removes the marks at both ends, one end at a time", () => {
    expect(unwrap('***"The Last Page"***')).toBe('"The Last Page"');
    expect(unwrap('*** "The Rivers\' Edge"***')).toBe('"The Rivers\' Edge"');
    expect(unwrap("*E**nd of Chapter 9")).toBe("End of Chapter 9");
    expect(unwrap('"Leah"***')).toBe('"Leah"');
    expect(unwrap("**[ Old words. ] **")).toBe("[ Old words. ]");
  });
});

describe("cutting the chapter ending out of the blocks", () => {
  it("joins the name from the next paragraph", () => {
    const pieces = findEndings([
      paragraph("Prose."),
      paragraph("***End of Chapter 4***"),
      paragraph('***"The Lamp"***'),
    ]);
    expect(pieces).toEqual([
      paragraph("Prose."),
      { kind: "ending", lines: ["End of Chapter 4", '"The Lamp"'] },
    ]);
  });

  it("takes the name from the same paragraph", () => {
    expect(
      findEndings([paragraph("***End of Chapter 4***", '***"The Lamp"***')]),
    ).toEqual([{ kind: "ending", lines: ["End of Chapter 4", '"The Lamp"'] }]);
  });

  it("cuts a name that shares the line with the ending", () => {
    expect(
      findEndings([paragraph('***End of Chapter 4*** ***"The Lamp"***')]),
    ).toEqual([{ kind: "ending", lines: ["End of Chapter 4", '"The Lamp"'] }]);
  });

  it("keeps the prose that comes before the ending in one paragraph", () => {
    expect(
      findEndings([paragraph("Last line.", "***End of Part 1***")]),
    ).toEqual([
      paragraph("Last line."),
      { kind: "ending", lines: ["End of Part 1"] },
    ]);
  });

  it("joins a closing thought spread over several paragraphs", () => {
    const pieces = findEndings([
      paragraph("***End of Chapter 4***"),
      paragraph('***"The Lamp"***'),
      paragraph("[ Some lights go out"),
      paragraph("without a flicker. ]"),
      paragraph("After."),
    ]);
    expect(pieces).toEqual([
      { kind: "ending", lines: ["End of Chapter 4", '"The Lamp"'] },
      {
        kind: "closing",
        lines: ["[ Some lights go out", "without a flicker. ]"],
      },
      paragraph("After."),
    ]);
  });

  it("reads a closing thought in bold the same as a plain one", () => {
    const pieces = findEndings([
      paragraph("***End of Chapter 4***", '***"The Lamp"***'),
      paragraph("**[ The 1 named 0. ] **"),
    ]);
    expect(pieces[1]).toEqual({
      kind: "closing",
      lines: ["[ The 1 named 0. ]"],
    });
  });

  it("leaves an open bracket alone when nothing closes it", () => {
    const pieces = findEndings([
      paragraph("***End of Chapter 4***"),
      paragraph("[ An aside"),
      { kind: "break", text: "---" },
      paragraph("that never closes. ]"),
    ]);
    expect(pieces).toEqual([
      { kind: "ending", lines: ["End of Chapter 4"] },
      paragraph("[ An aside"),
      { kind: "break", text: "---" },
      paragraph("that never closes. ]"),
    ]);
  });

  it("finds a second ending, as at the end of a volume", () => {
    const pieces = findEndings([
      paragraph("***End of Chapter 37***"),
      paragraph('***"The Last Memory"***'),
      paragraph("***End of Volume 7***"),
      paragraph('***"The Acceptance"***'),
      paragraph("[ A new morning. ]"),
    ]);
    expect(pieces.map((piece) => piece.kind)).toEqual([
      "ending",
      "ending",
      "closing",
    ]);
  });

  it("leaves a chapter with no ending as it was", () => {
    const blocks = [paragraph("One."), paragraph("**[ Not a closing. ]**")];
    expect(findEndings(blocks)).toEqual(blocks);
  });
});
