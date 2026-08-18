import { describe, expect, it } from "vitest";
import { formatDriveSearchLocation } from "./drive-search";

describe("formatDriveSearchLocation", () => {
  it("returns Drive for the root", () => {
    expect(formatDriveSearchLocation([])).toBe("Drive");
  });

  it("returns the full path when it has one or two segments", () => {
    expect(formatDriveSearchLocation(["Songs"])).toBe("Songs");
    expect(formatDriveSearchLocation(["Songs", "Demos"])).toBe("Songs / Demos");
  });

  it("ellipses the middle when the path has three or more segments", () => {
    expect(formatDriveSearchLocation(["Songs", "Demos", "2026", "Live Takes"])).toBe(
      "Songs / … / Live Takes",
    );
  });
});
