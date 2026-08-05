import dayjs from "dayjs"
import { describe, expect, it } from "vitest"

import {
  bucketDayEvents,
  eventOccursOnDay,
  formatDayTitle,
  formatMonthTitle,
  formatWeekRangeTitle,
  getEventBlockPosition,
  getEventsForDay,
  getMonthGrid,
  getWeekDays,
  moveEventToStart,
  pixelOffsetToMinutes,
  resizeEventEnd,
} from "./helpers"
import type { CalendarEvent } from "./types"

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Event",
    startDate: dayjs("2026-07-15T09:00:00").toDate(),
    endDate: dayjs("2026-07-15T10:00:00").toDate(),
    color: "blue",
    type: null,
    organizationId: null,
    place: null,
    ...overrides,
  }
}

describe("getMonthGrid", () => {
  it("returns 42 cells spanning full weeks around the month", () => {
    const cells = getMonthGrid(dayjs("2026-07-15").toDate())
    expect(cells).toHaveLength(42)
    expect(cells[0]!.date.day()).toBe(0)
    expect(cells[41]!.date.day()).toBe(6)
  })

  it("flags cells outside the target month", () => {
    const cells = getMonthGrid(dayjs("2026-07-15").toDate())
    const julyCells = cells.filter((cell) => cell.isCurrentMonth)
    expect(julyCells).toHaveLength(31)
    expect(julyCells.every((cell) => cell.date.month() === 6)).toBe(true)
  })
})

describe("getWeekDays", () => {
  it("returns 7 consecutive days starting on Sunday", () => {
    const days = getWeekDays(dayjs("2026-07-15").toDate())
    expect(days).toHaveLength(7)
    expect(days[0]!.day()).toBe(0)
    expect(days[6]!.diff(days[0]!, "day")).toBe(6)
  })
})

describe("eventOccursOnDay / getEventsForDay", () => {
  it("matches an event that starts and ends within the day", () => {
    const event = makeEvent()
    expect(eventOccursOnDay(event, dayjs("2026-07-15").toDate())).toBe(true)
    expect(eventOccursOnDay(event, dayjs("2026-07-16").toDate())).toBe(false)
  })

  it("matches every day of a multi-day event", () => {
    const event = makeEvent({
      startDate: dayjs("2026-07-15T09:00:00").toDate(),
      endDate: dayjs("2026-07-17T18:00:00").toDate(),
    })
    expect(eventOccursOnDay(event, dayjs("2026-07-16").toDate())).toBe(true)
  })

  it("sorts events for a day by start time", () => {
    const late = makeEvent({ id: "late", startDate: dayjs("2026-07-15T14:00:00").toDate(), endDate: dayjs("2026-07-15T15:00:00").toDate() })
    const early = makeEvent({ id: "early", startDate: dayjs("2026-07-15T08:00:00").toDate(), endDate: dayjs("2026-07-15T09:00:00").toDate() })
    const result = getEventsForDay([late, early], dayjs("2026-07-15").toDate())
    expect(result.map((e) => e.id)).toEqual(["early", "late"])
  })
})

describe("bucketDayEvents", () => {
  it("returns all events with no overflow when under the limit", () => {
    const events = [makeEvent({ id: "1" }), makeEvent({ id: "2" })]
    const bucket = bucketDayEvents(events, 3)
    expect(bucket.visible).toHaveLength(2)
    expect(bucket.overflowCount).toBe(0)
  })

  it("caps visible events and reports overflow", () => {
    const events = Array.from({ length: 5 }, (_, i) => makeEvent({ id: String(i) }))
    const bucket = bucketDayEvents(events, 3)
    expect(bucket.visible).toHaveLength(3)
    expect(bucket.overflowCount).toBe(2)
  })
})

describe("getEventBlockPosition", () => {
  it("positions a 1-hour event at 9am as 37.5% top, ~4.17% height", () => {
    const event = makeEvent()
    const position = getEventBlockPosition(event, dayjs("2026-07-15").toDate())
    expect(position.topPercent).toBeCloseTo((9 * 60 / 1440) * 100, 5)
    expect(position.heightPercent).toBeCloseTo((60 / 1440) * 100, 5)
  })

  it("clamps a multi-day event to the given day's boundaries", () => {
    const event = makeEvent({
      startDate: dayjs("2026-07-14T20:00:00").toDate(),
      endDate: dayjs("2026-07-16T04:00:00").toDate(),
    })
    const position = getEventBlockPosition(event, dayjs("2026-07-15").toDate())
    expect(position.topPercent).toBe(0)
    expect(position.heightPercent).toBeGreaterThan(99.9)
  })

  it("enforces a minimum visible height for very short events", () => {
    const event = makeEvent({
      startDate: dayjs("2026-07-15T09:00:00").toDate(),
      endDate: dayjs("2026-07-15T09:01:00").toDate(),
    })
    const position = getEventBlockPosition(event, dayjs("2026-07-15").toDate())
    expect(position.heightPercent).toBeCloseTo((15 / 1440) * 100, 5)
  })
})

describe("formatting", () => {
  it("formats a month title", () => {
    expect(formatMonthTitle(dayjs("2026-07-15").toDate())).toBe("July 2026")
  })

  it("formats a week range within the same month", () => {
    expect(formatWeekRangeTitle(dayjs("2026-07-15").toDate())).toBe(
      "July 12 - 18, 2026"
    )
  })

  it("formats a day title", () => {
    expect(formatDayTitle(dayjs("2026-07-15").toDate())).toBe(
      "Wednesday, July 15, 2026"
    )
  })
})

describe("moveEventToStart", () => {
  it("preserves duration while moving the start", () => {
    const event = makeEvent()
    const moved = moveEventToStart(event, dayjs("2026-07-20T13:00:00").toDate())
    expect(dayjs(moved.startDate).format()).toBe(
      dayjs("2026-07-20T13:00:00").format()
    )
    expect(dayjs(moved.endDate).diff(moved.startDate, "minute")).toBe(60)
  })
})

describe("resizeEventEnd", () => {
  it("updates the end date when after the start", () => {
    const event = makeEvent()
    const resized = resizeEventEnd(event, dayjs("2026-07-15T11:30:00").toDate())
    expect(dayjs(resized.endDate).format()).toBe(
      dayjs("2026-07-15T11:30:00").format()
    )
  })

  it("clamps to a 15-minute minimum duration when the new end precedes the start", () => {
    const event = makeEvent()
    const resized = resizeEventEnd(event, dayjs("2026-07-15T09:05:00").toDate())
    expect(dayjs(resized.endDate).diff(event.startDate, "minute")).toBe(15)
  })
})

describe("pixelOffsetToMinutes", () => {
  it("converts a mid-container offset to minutes, snapped", () => {
    expect(pixelOffsetToMinutes(360, 1440, 15)).toBe(360)
  })

  it("clamps offsets outside the container", () => {
    expect(pixelOffsetToMinutes(-10, 1440)).toBe(0)
    expect(pixelOffsetToMinutes(2000, 1440)).toBe(1440)
  })
})
