import { describe, expect, it } from "vitest";
import { computeReorderPosition } from "./index.js";

describe("computeReorderPosition", () => {
  it("returns 0 for the first item in an empty list", () => {
    expect(computeReorderPosition({ before: null, after: null })).toBe(0);
  });

  it("returns one less than the following item when dropped at the start", () => {
    expect(computeReorderPosition({ before: null, after: 5 })).toBe(4);
  });

  it("returns one more than the preceding item when dropped at the end", () => {
    expect(computeReorderPosition({ before: 5, after: null })).toBe(6);
  });

  it("returns the midpoint when dropped between two items", () => {
    expect(computeReorderPosition({ before: 2, after: 4 })).toBe(3);
  });
});
