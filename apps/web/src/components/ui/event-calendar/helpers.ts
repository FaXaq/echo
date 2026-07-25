import dayjs, { type Dayjs } from "dayjs"

import type { CalendarEvent, CalendarEventRange } from "./types"

export const MINUTES_IN_DAY = 24 * 60
export const MIN_EVENT_DURATION_MINUTES = 15

export interface MonthGridCell {
  date: Dayjs
  isCurrentMonth: boolean
}

export function getMonthGrid(date: Date): MonthGridCell[] {
  const firstOfMonth = dayjs(date).startOf("month")
  const gridStart = firstOfMonth.startOf("week")
  const totalCells = 42

  return Array.from({ length: totalCells }, (_, i) => {
    const day = gridStart.add(i, "day")
    return { date: day, isCurrentMonth: day.month() === firstOfMonth.month() }
  })
}

export function getWeekDays(date: Date): Dayjs[] {
  const start = dayjs(date).startOf("week")
  return Array.from({ length: 7 }, (_, i) => start.add(i, "day"))
}

export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = dayjs(day).startOf("day")
  const dayEnd = dayjs(day).endOf("day")
  const start = dayjs(event.startDate)
  const end = dayjs(event.endDate)
  return !start.isAfter(dayEnd) && !end.isBefore(dayStart)
}

export function getEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  return events
    .filter((event) => eventOccursOnDay(event, day))
    .sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)))
}

export interface DayEventBucket {
  visible: CalendarEvent[]
  overflowCount: number
}

export function bucketDayEvents(
  events: CalendarEvent[],
  maxVisible: number
): DayEventBucket {
  if (events.length <= maxVisible) {
    return { visible: events, overflowCount: 0 }
  }
  return {
    visible: events.slice(0, maxVisible),
    overflowCount: events.length - maxVisible,
  }
}

export interface EventBlockPosition {
  topPercent: number
  heightPercent: number
}

export function getEventBlockPosition(
  event: CalendarEvent,
  day: Date
): EventBlockPosition {
  const dayStart = dayjs(day).startOf("day")
  const dayEnd = dayjs(day).endOf("day")
  const start = dayjs(event.startDate).isBefore(dayStart)
    ? dayStart
    : dayjs(event.startDate)
  const end = dayjs(event.endDate).isAfter(dayEnd)
    ? dayEnd
    : dayjs(event.endDate)

  const startMinutes = start.diff(dayStart, "minute")
  const durationMinutes = Math.max(
    end.diff(start, "minute"),
    MIN_EVENT_DURATION_MINUTES
  )

  return {
    topPercent: (startMinutes / MINUTES_IN_DAY) * 100,
    heightPercent: (durationMinutes / MINUTES_IN_DAY) * 100,
  }
}

export function formatMonthTitle(date: Date): string {
  return dayjs(date).format("MMMM YYYY")
}

export function formatWeekRangeTitle(date: Date): string {
  const days = getWeekDays(date)
  const start = days[0]!
  const end = days[6]!

  if (start.isSame(end, "month")) {
    return `${start.format("MMMM D")} - ${end.format("D, YYYY")}`
  }
  if (start.isSame(end, "year")) {
    return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`
  }
  return `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`
}

export function formatDayTitle(date: Date): string {
  return dayjs(date).format("dddd, MMMM D, YYYY")
}

export function moveEventToStart(
  event: CalendarEvent,
  newStart: Date
): CalendarEvent {
  const durationMinutes = dayjs(event.endDate).diff(event.startDate, "minute")
  const start = dayjs(newStart)

  return {
    ...event,
    startDate: start.toDate(),
    endDate: start.add(durationMinutes, "minute").toDate(),
  }
}

export function resizeEventEnd(
  event: CalendarEvent,
  newEndDate: Date
): CalendarEvent {
  const minEnd = dayjs(event.startDate).add(
    MIN_EVENT_DURATION_MINUTES,
    "minute"
  )
  const end = dayjs(newEndDate).isBefore(minEnd) ? minEnd : dayjs(newEndDate)
  return { ...event, endDate: end.toDate() }
}

export function currentHourRange(day: Date = new Date()): CalendarEventRange {
  const start = dayjs(day)
    .hour(dayjs().hour())
    .minute(0)
    .second(0)
    .millisecond(0)
  return { start: start.toDate(), end: start.add(1, "hour").toDate() }
}

export function pixelOffsetToMinutes(
  offsetY: number,
  containerHeight: number,
  snapMinutes = MIN_EVENT_DURATION_MINUTES
): number {
  if (containerHeight <= 0) return 0
  const ratio = Math.min(Math.max(offsetY / containerHeight, 0), 1)
  const minutes = ratio * MINUTES_IN_DAY
  return Math.round(minutes / snapMinutes) * snapMinutes
}
