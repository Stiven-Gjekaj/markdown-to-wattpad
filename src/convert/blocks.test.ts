import { describe, expect, it } from "vitest";
import { readBlocks } from "./blocks";

describe("cutting a chapter into blocks", () => {
  it("starts a paragraph at a blank line and keeps single breaks", () => {
    expect(readBlocks("One.\nTwo.\n\nThree.")).toEqual([
      { kind: "paragraph", lines: ["One.", "Two."] },
      { kind: "paragraph", lines: ["Three."] },
    ]);
  });

  it("treats a line of spaces as a blank line", () => {
    expect(readBlocks("One.\n   \t\nTwo.")).toHaveLength(2);
  });

  it("reads an indented paragraph as text, not code", () => {
    expect(readBlocks("    She waited.\n\tHe did not.")).toEqual([
      { kind: "paragraph", lines: ["She waited.", "He did not."] },
    ]);
  });

  it("keeps a list marker as text", () => {
    expect(readBlocks("*Quote.*\n- Jess Kalm\n1990. A year.")).toEqual([
      {
        kind: "paragraph",
        lines: ["*Quote.*", "- Jess Kalm", "1990. A year."],
      },
    ]);
  });

  it("reads ATX headings and not a hashtag", () => {
    expect(readBlocks("# Title #\n###### Six\n#tag\n####### seven")).toEqual([
      { kind: "heading", depth: 1, text: "Title" },
      { kind: "heading", depth: 6, text: "Six" },
      { kind: "paragraph", lines: ["#tag", "####### seven"] },
    ]);
  });

  it("reads a scene break in each form, even under a line of text", () => {
    const blocks = readBlocks("Text.\n---\n* * *\n___\n- - -");
    expect(blocks).toEqual([
      { kind: "paragraph", lines: ["Text."] },
      { kind: "break", text: "---" },
      { kind: "break", text: "* * *" },
      { kind: "break", text: "___" },
      { kind: "break", text: "- - -" },
    ]);
  });

  it("does not take two hyphens for a break", () => {
    expect(readBlocks("--")).toEqual([{ kind: "paragraph", lines: ["--"] }]);
  });

  it("keeps fenced code as it is, blank lines included", () => {
    expect(readBlocks("```\n  a *b*\n\nc\n```\nAfter.")).toEqual([
      { kind: "code", lines: ["  a *b*", "", "c"] },
      { kind: "paragraph", lines: ["After."] },
    ]);
  });

  it("closes a fence only on the same character", () => {
    const blocks = readBlocks("~~~\n```\n~~~~\nText.");
    expect(blocks).toEqual([
      { kind: "code", lines: ["```"] },
      { kind: "paragraph", lines: ["Text."] },
    ]);
  });

  it("removes the quote marker, nested ones too", () => {
    expect(readBlocks("> One.\n> > Two.\n>\n> Three.")).toEqual([
      { kind: "paragraph", lines: ["One.", "Two."] },
      { kind: "paragraph", lines: ["Three."] },
    ]);
  });
});
