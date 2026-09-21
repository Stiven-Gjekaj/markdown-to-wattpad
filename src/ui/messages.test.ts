import { expect, describe as group, it } from "vitest";
import { describe, numberList } from "./messages";

group("the words for a notice", () => {
  it("names the pictures that were left out", () => {
    expect(describe({ kind: "image", alts: ["The map", ""] })).toBe(
      '2 pictures ("The map") left out. Wattpad takes a picture only as an upload. Add it in the Wattpad writer.',
    );
  });

  it("uses the singular for one", () => {
    expect(describe({ kind: "link", count: 1 })).toMatch(/^1 link became/);
    expect(describe({ kind: "dash", count: 1 })).toMatch(/^1 em dash in/);
    expect(describe({ kind: "dash", count: 2 })).toMatch(/^2 em dashes in/);
  });

  it("names the paragraphs that show asterisks", () => {
    expect(describe({ kind: "stray", paragraphs: [4] })).toMatch(
      /^Paragraph 4 still shows asterisks\./,
    );
    expect(describe({ kind: "stray", paragraphs: [4, 9] })).toMatch(
      /^Paragraphs 4 and 9 still show asterisks\./,
    );
  });

  it("shows each tag the way it was written", () => {
    expect(describe({ kind: "tag", names: ["center", "span"] })).toContain(
      "<center>, <span>",
    );
  });
});

group("a list of numbers", () => {
  it("joins the numbers the way a sentence does", () => {
    expect(numberList([3])).toBe("3");
    expect(numberList([3, 7])).toBe("3 and 7");
    expect(numberList([3, 7, 12])).toBe("3, 7, and 12");
  });

  it("stops after six", () => {
    expect(numberList([1, 2, 3, 4, 5, 6, 7, 8])).toBe(
      "1, 2, 3, 4, 5, 6, and 2 more",
    );
  });
});
