import { describe, expect, it } from "vitest";
import { formatChordSymbol, isChordSymbol, parseChordSymbol } from "./chord-symbol.js";

describe("chord symbol", () => {
  it.each([
    ["Am", { root: "A", alter: 0, suffix: "m", bass: null }],
    ["F#m7b5", { root: "F", alter: 1, suffix: "m7b5", bass: null }],
    ["Bbmaj7", { root: "B", alter: -1, suffix: "maj7", bass: null }],
    ["C/E", { root: "C", alter: 0, suffix: "", bass: { step: "E", alter: 0 } }],
    ["D7/F#", { root: "D", alter: 0, suffix: "7", bass: { step: "F", alter: 1 } }],
  ])("parses %s", (input, expected) => expect(parseChordSymbol(input)).toEqual(expected));

  it.each(["", "H7", "c", "Am/", "%", "N.C.", "C G"])("rejects %j", (input) => {
    expect(parseChordSymbol(input)).toBeNull();
    expect(isChordSymbol(input)).toBe(false);
  });

  it("formats back to the same text", () => {
    for (const s of ["Am", "F#m7b5", "Bbmaj7", "C/E", "D7/F#"]) {
      const parsed = parseChordSymbol(s);
      if (!parsed) throw new Error(`failed to parse ${s}`);
      expect(formatChordSymbol(parsed)).toBe(s);
    }
  });
});
