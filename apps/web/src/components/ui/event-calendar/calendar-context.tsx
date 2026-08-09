import { createContext, useContext } from "react";

import type { CalendarEvent, CalendarEventRange } from "./types";

export interface CalendarContextValue {
  requestEventClick: (event: CalendarEvent) => void;
  requestEventCreate: (range: CalendarEventRange) => void;
  requestEventMove: (event: CalendarEvent, target: Date) => void;
  requestEventResize: (event: CalendarEvent, newEndDate: Date) => void;
  requestDayOverflow: (day: Date, events: CalendarEvent[]) => void;
}

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarContext(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("Calendar sub-components must be rendered within <EventCalendar>");
  }
  return context;
}
