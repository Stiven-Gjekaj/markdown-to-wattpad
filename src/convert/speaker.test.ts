import { describe, expect, it } from "vitest";
import { boldLabel, speakerOf } from "./speaker";

describe("finding a line of dialogue", () => {
  it("reads a bold label with the colon outside", () => {
    expect(speakerOf("**NES**: There's some left.")).toEqual({
      label: "NES",
      bold: true,
    });
  });

  it("reads a bold label with the colon inside", () => {
    expect(speakerOf("**JHN?:** See how easy it is?")).toEqual({
      label: "JHN?",
      bold: true,
    });
  });

  it("reads labels with marks, digits, and spaces", () => {
    for (const label of ["???", "///", "KID #1", "NER & SHN", "NEWS ANCHOR"]) {
      expect(speakerOf(`**${label}**: Words.`)?.label).toBe(label);
      expect(speakerOf(`${label}: Words.`)?.label).toBe(label);
    }
  });

  it("reads underscores as bold marks", () => {
    expect(speakerOf("__ART__: I'll defeat him.")?.label).toBe("ART");
  });

  it("reads a plain label in capitals", () => {
    expect(speakerOf("MSTR: Name.")).toEqual({ label: "MSTR", bold: false });
    expect(speakerOf("GD2: Halt.")?.label).toBe("GD2");
  });

  it("does not read prose as dialogue", () => {
    const prose = [
      "Note: the door was open.",
      "He said: nothing.",
      "10: 30 was late.",
      "**[ The 1 named 0. ]**",
      "***End of Chapter 243***",
      "**31X**, found her in the valley.",
      "**Ferocity - **That was her soul trait.",
      "HTTP://EXAMPLE.COM",
      "A VERY LONG LABEL THAT GOES ON: words",
    ];
    for (const line of prose) {
      expect(speakerOf(line), line).toBeNull();
    }
  });

  it("does not take a bold run with a space at its edge", () => {
    expect(speakerOf("** NES**: words")).toBeNull();
    expect(speakerOf("**NES **: words")).toBeNull();
  });
});

describe("writing a plain label in bold", () => {
  it("wraps the label and keeps the rest", () => {
    const line = "MSTR: Name.";
    const speaker = speakerOf(line);
    expect(speaker).not.toBeNull();
    if (speaker) {
      expect(boldLabel(line, speaker)).toBe("**MSTR**: Name.");
    }
  });

  it("leaves a bold label alone", () => {
    const line = "**NES**: Yes.";
    const speaker = speakerOf(line);
    expect(speaker?.bold).toBe(true);
    if (speaker) {
      expect(boldLabel(line, speaker)).toBe(line);
    }
  });
});
