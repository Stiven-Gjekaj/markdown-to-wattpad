import { describe, expect, it } from "vitest";
import { readBlocks } from "./blocks";
import { buildSegments, type Rules, type Segment } from "./paragraphs";
import { emptyFound, textOf } from "./runs";

const RULES: Rules = {
  joinDialogue: true,
  boldSpeakers: true,
  styleEnding: true,
};

function build(markdown: string, rules: Partial<Rules> = {}): Segment[] {
  return buildSegments(
    readBlocks(markdown),
    { ...RULES, ...rules },
    emptyFound(),
  );
}

/** Each segment as its kind and the text of its lines. */
function shape(segments: Segment[]): [string, string[]][] {
  return segments.map((segment) => [segment.kind, segment.lines.map(textOf)]);
}

describe("building paragraphs", () => {
  it("joins dialogue lines that a blank line separates", () => {
    const segments = build("**MAR**: You came.\n\n**TOM**: I said I would.");
    expect(shape(segments)).toEqual([
      ["dialogue", ["MAR: You came.", "TOM: I said I would."]],
    ]);
  });

  it("keeps them apart when told to", () => {
    const segments = build("**MAR**: You came.\n\n**TOM**: I said I would.", {
      joinDialogue: false,
    });
    expect(segments.map((segment) => segment.kind)).toEqual([
      "dialogue",
      "dialogue",
    ]);
  });

  it("keeps lines of one paragraph together, even when told to split", () => {
    const segments = build("**MAR**: You came.\n**TOM**: I did.", {
      joinDialogue: false,
    });
    expect(segments).toHaveLength(1);
  });

  it("does not join dialogue across narration or a scene break", () => {
    const segments = build(
      "**A**: One.\n\nShe left.\n\n**B**: Two.\n\n---\n\n**A**: Three.",
    );
    expect(segments.map((segment) => segment.kind)).toEqual([
      "dialogue",
      "narration",
      "dialogue",
      "break",
      "dialogue",
    ]);
  });

  it("cuts narration off the front of a paragraph that turns to dialogue", () => {
    expect(shape(build("He turned to her.\n**MAR**: Well?"))).toEqual([
      ["narration", ["He turned to her."]],
      ["dialogue", ["MAR: Well?"]],
    ]);
  });

  it("keeps a line with no speaker inside the dialogue that it follows", () => {
    expect(
      shape(build("**BRR**: It's a ring I made\nthat failed four times.")),
    ).toEqual([
      ["dialogue", ["BRR: It's a ring I made", "that failed four times."]],
    ]);
  });

  it("writes a plain speaker label in bold, unless told not to", () => {
    const [bold] = build("MSTR: Name.");
    expect(bold.lines[0][0]).toEqual({
      text: "MSTR",
      bold: true,
      italic: false,
      underline: false,
    });
    const [plain] = build("MSTR: Name.", { boldSpeakers: false });
    expect(plain.lines[0]).toEqual([
      { text: "MSTR: Name.", bold: false, italic: false, underline: false },
    ]);
  });

  it("does not let one speaker's open asterisk reach the next speaker", () => {
    const [segment] = build("**A**: an *open mark\n**B**: plain words*");
    const b = segment.lines[1];
    expect(b.filter((run) => run.italic)).toEqual([]);
  });

  it("sets a later heading in bold", () => {
    const [heading] = build("## Part Two");
    expect(heading.kind).toBe("heading");
    expect(heading.lines[0].every((run) => run.bold)).toBe(true);
  });

  it("keeps a scene break as the writer typed it", () => {
    expect(shape(build("* * *"))).toEqual([["break", ["* * *"]]]);
  });

  it("styles the ending and the closing thought", () => {
    const segments = build(
      '***End of Chapter 4***\n\n***"The Lamp"***\n\n[ Some lights\n\ngo out. ]',
    );
    expect(shape(segments)).toEqual([
      ["ending", ["End of Chapter 4", '"The Lamp"']],
      ["closing", ["[ Some lights", "go out. ]"]],
    ]);
    const [ending, closing] = segments;
    for (const run of ending.lines.flat()) {
      expect(run.bold && run.italic && run.underline).toBe(true);
    }
    for (const run of closing.lines.flat()) {
      expect(run.bold && !run.italic && !run.underline).toBe(true);
    }
  });

  it("leaves the ending alone when told to", () => {
    const segments = build('***End of Chapter 4***\n\n***"The Lamp"***', {
      styleEnding: false,
    });
    expect(segments.map((segment) => segment.kind)).toEqual([
      "narration",
      "narration",
    ]);
    expect(segments[0].lines[0][0].underline).toBe(false);
  });
});
