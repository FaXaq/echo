import { describe, expect, it } from "vitest";
import { toCalendarEvent, type CalendarEventRow } from "./map-calendar-event.js";

function makeRow(overrides: Partial<CalendarEventRow> = {}): CalendarEventRow {
  return {
    id: "1",
    title: "Standup",
    description: null,
    start_date: new Date("2026-08-05T09:00:00Z"),
    end_date: new Date("2026-08-05T09:30:00Z"),
    all_day: false,
    color: "blue",
    type: null,
    organization_id: null,
    created_by: "user-1",
    updated_by: null,
    place_name: null,
    place_address: null,
    place_lat: null,
    place_lng: null,
    ...overrides,
  };
}

describe("toCalendarEvent", () => {
  it("maps a null type to null", () => {
    expect(toCalendarEvent(makeRow({ type: null })).type).toBeNull();
  });

  it("parses a valid stored type", () => {
    expect(toCalendarEvent(makeRow({ type: "concert" })).type).toBe("concert");
  });

  it("throws when the stored type is not a known EventType", () => {
    expect(() => toCalendarEvent(makeRow({ type: "not-a-type" }))).toThrow();
  });
});
