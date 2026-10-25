import { describe, expect, it } from "vitest";
import { parseTimeSignature, songStructureSchema } from "./structure.js";

const section = {
  id: "s1",
  kind: "verse",
  name: "Verse",
  repeat: 1,
  time: null,
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
  ])("rejects a section with %s", (_, override) => {
    expect(songStructureSchema.safeParse({ sections: [{ ...section, ...override }] }).success).toBe(
      false,
    );
  });
});
