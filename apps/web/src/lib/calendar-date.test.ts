import { describe, expect, it } from "vitest";

import { formatCalendarDate, parseCalendarDate } from "./calendar-date";

describe("formatCalendarDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatCalendarDate(new Date(2026, 7, 5))).toBe("2026-08-05");
  });

  it("pads single-digit months and days", () => {
    expect(formatCalendarDate(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});

describe("parseCalendarDate", () => {
  it("parses a valid YYYY-MM-DD string as a local-time date", () => {
    expect(parseCalendarDate("2026-08-05")).toEqual(new Date(2026, 7, 5));
  });

  it("returns null for a malformed string", () => {
    expect(parseCalendarDate("not-a-date")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseCalendarDate("")).toBeNull();
  });

  it("returns null for an out-of-range calendar date", () => {
    expect(parseCalendarDate("2026-02-30")).toBeNull();
  });

  it("returns null for a non YYYY-MM-DD shaped string", () => {
    expect(parseCalendarDate("2026-08-05T00:00:00.000Z")).toBeNull();
  });
});
