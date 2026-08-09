import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { useCalendarContext } from "./calendar-context";
import { EventCard } from "./event-card";
import { bucketDayEvents, currentHourRange, getEventsForDay, getMonthGrid } from "./helpers";
import type { CalendarEvent } from "./types";

const MAX_VISIBLE_EVENTS_PER_DAY = 3;

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
}

export function MonthView({ date, events }: MonthViewProps) {
  const { t } = useTranslation("calendar");
  const { requestEventCreate, requestDayOverflow } = useCalendarContext();
  const cells = getMonthGrid(date);
  const today = dayjs();

  return (
    <div data-slot="month-view" className="flex flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {cells.slice(0, 7).map((cell) => (
          <div
            key={cell.date.day()}
            className="px-2 py-1.5 text-center text-[0.6875rem] font-medium text-muted-foreground"
          >
            {cell.date.format("ddd")}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {cells.map((cell) => {
          const dayEvents = getEventsForDay(events, cell.date.toDate());
          const { visible, overflowCount } = bucketDayEvents(dayEvents, MAX_VISIBLE_EVENTS_PER_DAY);
          const isToday = cell.date.isSame(today, "day");

          return (
            <div
              key={cell.date.format("YYYY-MM-DD")}
              data-drop-day={cell.date.format("YYYY-MM-DD")}
              onClick={() => {
                requestEventCreate(currentHourRange(cell.date.toDate()));
              }}
              className={cn(
                "flex min-h-0 flex-col gap-1 overflow-hidden border-b border-r p-1 last:border-r-0 cursor-pointer hover:bg-accent transition-colors",
                !cell.isCurrentMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[0.6875rem] font-medium",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {cell.date.date()}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {visible.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {overflowCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDayOverflow(cell.date.toDate(), dayEvents);
                  }}
                  className="shrink-0 px-1.5 text-left text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("+{{count}} more", { count: overflowCount })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
