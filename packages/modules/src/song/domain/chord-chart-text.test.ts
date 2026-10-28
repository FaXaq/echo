import { describe, expect, it } from "vitest";
import { barLabel, barsToText, normalizeBars, textToBars } from "./chord-chart-text.js";
import type { Bar, TimeSignature } from "./structure.js";

const bars = (...xs: string[][]): Bar[] => xs.map((chords) => ({ chords }));

describe("chord chart text", () => {
  it("labels repeats, splits and no-chord bars", () => {
    const b = bars(["Am"], ["Am"], ["C", "G"], []);
    expect([0, 1, 2, 3].map((i) => barLabel(b, i))).toEqual(["Am", "%", "C / G", "N.C."]);
  });

  it("a bar with a time override is never shown as %", () => {
    expect(
      barLabel([{ chords: ["Am"] }, { chords: ["Am"], time: { beats: 2, beatType: 4 } }], 1),
    ).toBe("Am");
  });

  it("writes 4 bars per line", () => {
    expect(barsToText(bars(["Am"], ["Am"], ["F"], ["F"], ["C"], ["G", "D"]))).toBe(
      "| Am | % | F | % |\n| C | G / D |",
    );
  });

  it("writes a time override in parentheses", () => {
    expect(barsToText([{ chords: ["Am"], time: { beats: 3, beatType: 4 } }])).toBe("| (3/4) Am |");
  });

  it("parses its own output back", () => {
    const b: Bar[] = [
      { chords: ["Am"] },
      { chords: ["Am"] },
      { chords: ["C/E", "G"] },
      { chords: [] },
      { chords: ["F"], time: { beats: 2, beatType: 4 } },
    ];
    expect(textToBars(barsToText(b))).toEqual({ ok: true, bars: b });
  });

  it("accepts a space as split separator and ignores blank lines", () => {
    expect(textToBars("| C G |\n\n| F |")).toEqual({ ok: true, bars: bars(["C", "G"], ["F"]) });
  });

  it("keeps a slash chord as one chord", () => {
    expect(textToBars("| C/E |")).toEqual({ ok: true, bars: bars(["C/E"]) });
  });

  it("reports the first invalid bar (1-based) and token", () => {
    expect(textToBars("| Am | H7 |")).toEqual({ ok: false, bar: 2, token: "H7" });
  });

  it("rejects % as the first bar", () => {
    expect(textToBars("| % |")).toEqual({ ok: false, bar: 1, token: "%" });
  });

  it("rejects a bar with more than 8 chords, reporting the 9th", () => {
    expect(textToBars("| C | Am F C G Am F C G Am |")).toEqual({ ok: false, bar: 2, token: "Am" });
    expect(textToBars("| Am F C G Am F C G |").ok).toBe(true);
  });

  it("drops a bar time equal to the section time", () => {
    const time: TimeSignature = { beats: 4, beatType: 4 };
    expect(
      normalizeBars(
        [
          { chords: ["Am"], time },
          { chords: ["G"], time: { beats: 3, beatType: 4 } },
          { chords: [] },
        ],
        time,
      ),
    ).toEqual([
      { chords: ["Am"] },
      { chords: ["G"], time: { beats: 3, beatType: 4 } },
      { chords: [] },
    ]);
  });
});
