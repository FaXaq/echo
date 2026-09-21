import { describe, expect, it } from "vitest";
import { parseLogoPattern } from "./index";

describe("parseLogoPattern", () => {
  it("parses an already-parsed metadata object", () => {
    expect(parseLogoPattern({ logoPattern: [[1, 0]] })).toEqual([[1, 0]]);
  });

  it("parses a raw JSON string, as returned by better-auth's listOrganizations", () => {
    expect(parseLogoPattern('{"logoPattern":[[1,0]]}')).toEqual([[1, 0]]);
  });

  it("returns an empty pattern for null, undefined, or malformed metadata", () => {
    expect(parseLogoPattern(null)).toEqual([]);
    expect(parseLogoPattern(undefined)).toEqual([]);
    expect(parseLogoPattern("not json")).toEqual([]);
  });
});
