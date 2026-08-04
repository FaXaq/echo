export type EventColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay?: boolean
  color: EventColor
  organizationId: string | null;
}

export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarEventRange {
  start: Date
  end: Date
  allDay?: boolean
}
