import { z } from "zod"

export type EventColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"

export const eventTypeSchema = z.enum([
  "unavailability",
  "rehearsal",
  "concert",
  "meeting",
])
export type EventType = z.infer<typeof eventTypeSchema>
export const EVENT_TYPES: EventType[] = eventTypeSchema.options

export interface EventPlace {
  name: string
  address: string
  lat: number
  lng: number
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay?: boolean
  color: EventColor
  type: EventType | null
  organizationId: string | null;
  place: EventPlace | null;
}

export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEventRange {
  start: Date
  end: Date
  allDay?: boolean
}
