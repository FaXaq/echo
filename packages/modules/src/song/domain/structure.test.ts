import { describe, expect, it } from "vitest";
import { parseTimeSignature, songStructureSchema } from "./structure.js";

const section = {
  id: "s1",
  kind: "verse",
  name: "Verse",
  repeat: 1,
  time: { beats: 4, beatType: 4 },
  bars: [{ chords: ["Am"] }],
  notes: "",
};

describe("structure", () => {
  it("parses time signatures", () => {
    expect(parseTimeSignature("7/8")).toEqual({ beats: 7, beatType: 8 });
    for (const bad of ["4/3", "0/4", "33/4"]) expect(parseTimeSignature(bad)).toBeNull();
  });

  it("accepts a valid structure", () => {
    expect(songStructureSchema.safeParse({ sections: [section] }).success).toBe(true);
  });

  it.each([
    ["no bars", { bars: [] }],
    ["repeat 17", { repeat: 17 }],
    ["empty name", { name: "" }],
    ["invalid chord", { bars: [{ chords: ["H7"] }] }],
    ["51 char name", { name: "a".repeat(51) }],
    ["5001 char notes", { notes: "a".repeat(5001) }],
    ["257 bars", { bars: Array.from({ length: 257 }, () => ({ chords: ["C"] })) }],
    ["9 chords in a bar", { bars: [{ chords: Array(9).fill("C") }] }],
  ])("rejects a section with %s", (_, override) => {
    expect(songStructureSchema.safeParse({ sections: [{ ...section, ...override }] }).success).toBe(
      false,
    );
  });

  it.each([
    ["50 char name", { name: "a".repeat(50) }],
    ["5000 char notes", { notes: "a".repeat(5000) }],
    ["256 bars", { bars: Array.from({ length: 256 }, () => ({ chords: ["C"] })) }],
    ["8 chords in a bar", { bars: [{ chords: Array(8).fill("C") }] }],
  ])("accepts a section with %s", (_, override) => {
    expect(songStructureSchema.safeParse({ sections: [{ ...section, ...override }] }).success).toBe(
      true,
    );
  });

  it("rejects a section without time", () => {
    const { time: _time, ...withoutTime } = section;
    expect(songStructureSchema.safeParse({ sections: [withoutTime] }).success).toBe(false);
  });

  it("limits sections to 100", () => {
    const sections = (n: number) => ({ sections: Array.from({ length: n }, () => section) });
    expect(songStructureSchema.safeParse(sections(100)).success).toBe(true);
    expect(songStructureSchema.safeParse(sections(101)).success).toBe(false);
  });
});
