import { describe, expect, it } from "vitest";
import { dropEmptyBold, joinItalics, mendings, moveSpaces } from "./mend";

describe("dropping an empty bold run", () => {
  it("keeps the space and drops the marks", () => {
    expect(dropEmptyBold("**OFC**:** **This is final.")).toBe(
      "**OFC**: This is final.",
    );
  });

  it("leaves real bold alone", () => {
    expect(dropEmptyBold("**a** **b**")).toBe("**a** **b**");
  });
});

describe("moving a space out of a pair of marks", () => {
  it("moves the space after a closing mark", () => {
    expect(moveSpaces("reminded **Johann **of fire")).toBe(
      "reminded **Johann** of fire",
    );
    expect(moveSpaces('*"I love you," *she said.')).toBe(
      '*"I love you,"* she said.',
    );
  });

  it("moves the space before an opening mark", () => {
    expect(moveSpaces("Your* imagination *truly")).toBe(
      "Your *imagination* truly",
    );
  });

  it("leaves well formed marks alone", () => {
    const text = "a **bold** word and an *italic* one";
    expect(moveSpaces(text)).toBe(text);
  });

  it("ignores an escaped asterisk and a long run", () => {
    expect(moveSpaces("a \\* b")).toBe("a \\* b");
    expect(moveSpaces("f**** that ****")).toBe("f**** that ****");
  });
});

describe("joining two italic runs side by side", () => {
  it("removes the marks between them", () => {
    expect(joinItalics("*Then it arrived.\u00a0**But not for long.*")).toBe(
      "*Then it arrived.\u00a0But not for long.*",
    );
  });
});

describe("the list of mended copies", () => {
  it("leaves out the original and any copy that repeats", () => {
    const text = "*one. *Two";
    const copies = mendings(text);
    expect(copies).not.toContain(text);
    expect(new Set(copies).size).toBe(copies.length);
    expect(copies[0]).toBe("*one.* Two");
  });
});
