import { TimeGridView } from "./time-grid-view";
import type { CalendarEvent } from "./types";

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
}

export function DayView({ date, events }: DayViewProps) {
  return <TimeGridView days={[date]} events={events} />;
}
