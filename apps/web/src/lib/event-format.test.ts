import { describe, expect, it } from "vitest";
import { formatEventWhen } from "./event-format";

const at = (iso: string) => new Date(iso);

describe("formatEventWhen", () => {
  it("shows the date and a collapsed time range for a same-day timed event", () => {
    const label = formatEventWhen(
      { startDate: at("2026-11-07T17:00"), endDate: at("2026-11-07T19:00"), allDay: false },
      "en-US",
    );
    expect(label).toMatch(/Nov 7, 2026/);
    expect(label).toMatch(/5:00/);
    expect(label).toMatch(/7:00/);
    expect(label.match(/2026/g)).toHaveLength(1);
  });

  it("shows only the date for a one-day all-day event", () => {
    expect(
      formatEventWhen(
        { startDate: at("2026-11-07T00:00"), endDate: at("2026-11-07T23:59:59.999"), allDay: true },
        "en-US",
      ),
    ).toBe("Nov 7, 2026");
  });

  it("shows a date range for a multi-day all-day event", () => {
    const label = formatEventWhen(
      { startDate: at("2026-11-07T00:00"), endDate: at("2026-11-09T23:59:59.999"), allDay: true },
      "en-US",
    );
    expect(label).toMatch(/Nov 7/);
    expect(label).toMatch(/9, 2026/);
  });
});
