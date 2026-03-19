import { describe, it, expect } from "vitest";
import { stripExtension, computeOverlaps, computeClipWidthPx } from "./-clip-utils";
import { PIXELS_PER_MEASURE } from "./-constants";

describe("stripExtension", () => {
  it("strips a simple .wav extension", () => {
    expect(stripExtension("track.wav")).toBe("track");
  });

  it("strips a .midi extension", () => {
    expect(stripExtension("beat.midi")).toBe("beat");
  });

  it("strips only the last extension", () => {
    expect(stripExtension("my.song.mp3")).toBe("my.song");
  });

  it("returns filename unchanged when there is no extension", () => {
    expect(stripExtension("noextension")).toBe("noextension");
  });

  it("handles filenames that start with a dot", () => {
    expect(stripExtension(".hidden")).toBe("");
  });
});

describe("computeOverlaps", () => {
  it("returns empty array for fewer than 2 clips", () => {
    expect(computeOverlaps([])).toEqual([]);
    expect(computeOverlaps([{ left: 0, width: 100 }])).toEqual([]);
  });

  it("returns empty array for non-overlapping clips", () => {
    const regions = [
      { left: 0, width: 100 },
      { left: 200, width: 100 },
    ];
    expect(computeOverlaps(regions)).toEqual([]);
  });

  it("detects a simple overlap between two clips", () => {
    const regions = [
      { left: 0, width: 150 },
      { left: 100, width: 150 },
    ];
    const overlaps = computeOverlaps(regions);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]).toEqual({ left: 100, width: 50 });
  });

  it("does not count adjacent clips as overlapping", () => {
    const regions = [
      { left: 0, width: 100 },
      { left: 100, width: 100 },
    ];
    expect(computeOverlaps(regions)).toEqual([]);
  });

  it("handles multiple pairs of overlapping clips", () => {
    const regions = [
      { left: 0, width: 200 },
      { left: 100, width: 200 },
      { left: 150, width: 100 },
    ];
    const overlaps = computeOverlaps(regions);
    // Pair (0,1): overlap [100, 200) → left=100, width=100
    // Pair (0,2): overlap [150, 200) → left=150, width=50
    // Pair (1,2): overlap [150, 250) → left=150, width=100
    expect(overlaps).toHaveLength(3);
  });
});

describe("computeClipWidthPx", () => {
  const secondsPerMeasure = 2; // e.g. 120 bpm, 4/4

  it("returns PIXELS_PER_MEASURE minimum when durationMs is undefined", () => {
    expect(computeClipWidthPx(undefined, secondsPerMeasure)).toBe(PIXELS_PER_MEASURE);
  });

  it("computes correct width for a clip of exactly one measure duration", () => {
    const oneMeasureMs = secondsPerMeasure * 1000;
    expect(computeClipWidthPx(oneMeasureMs, secondsPerMeasure)).toBe(PIXELS_PER_MEASURE);
  });

  it("computes correct width for a two-measure clip", () => {
    const twoMeasuresMs = secondsPerMeasure * 2 * 1000;
    expect(computeClipWidthPx(twoMeasuresMs, secondsPerMeasure)).toBe(PIXELS_PER_MEASURE * 2);
  });

  it("never returns less than PIXELS_PER_MEASURE even for a very short clip", () => {
    expect(computeClipWidthPx(1, secondsPerMeasure)).toBe(PIXELS_PER_MEASURE);
  });
});
