import { describe, expect, it } from "vitest";
import { readSource } from "./source";

describe("reading the source", () => {
  it("turns CRLF and a lone CR into LF", () => {
    expect(readSource("one\r\ntwo\rthree").body).toBe("one\ntwo\nthree");
  });

  it("drops a byte order mark", () => {
    const input = "\ufeffText";
    expect(input.charCodeAt(0)).toBe(0xfeff);
    expect(readSource(input).body).toBe("Text");
  });

  it("removes front matter and keeps its title", () => {
    const source = readSource(
      '---\ntitle: "(Chapter 5 || Volume 1) The \\"Door\\"."\nchapter: "5"\n---\n\n# Heading\n',
    );
    expect(source.title).toBe('(Chapter 5 || Volume 1) The "Door".');
    expect(source.body).toBe("\n# Heading\n");
  });

  it("reads a single quoted and a bare title", () => {
    expect(readSource("---\ntitle: 'It''s here'\n---\nx").title).toBe(
      "It's here",
    );
    expect(readSource("---\ntitle: Plain words\n---\nx").title).toBe(
      "Plain words",
    );
  });

  it("keeps a chapter that opens with a scene break", () => {
    // The lines between the two breaks are story text. Taking them for front
    // matter would delete them without a word.
    const input = "---\nThe rain had stopped.\n---\nShe looked up.";
    const source = readSource(input);
    expect(source.body).toBe(input);
    expect(source.title).toBe("");
  });

  it("keeps speaker lines between two breaks", () => {
    // "NES: Hello" has the shape of a YAML key. No key in real front matter
    // is written in capitals only, so this is not front matter.
    const input = "---\nNES: Hello.\nBRR: Hi.\n---\nText.";
    expect(readSource(input).body).toBe(input);
  });

  it("removes a comment, even one that spans a blank line", () => {
    const source = readSource("Before.<!-- a note\n\nstill the note -->After.");
    expect(source.body).toBe("Before.After.");
  });
});
