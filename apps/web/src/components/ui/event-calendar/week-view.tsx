import { getWeekDays } from "./helpers"
import { TimeGridView } from "./time-grid-view"
import type { CalendarEvent } from "./types"

interface WeekViewProps {
  date: Date
  events: CalendarEvent[]
}

export function WeekView({ date, events }: WeekViewProps) {
  const days = getWeekDays(date).map((day) => day.toDate())
  return <TimeGridView days={days} events={events} />
}
