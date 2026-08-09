import { useEffect, useRef, useState, type RefObject } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { useCalendarContext } from "./calendar-context";
import { EventBlock } from "./event-block";
import { EventCard } from "./event-card";
import { getEventsForDay, MINUTES_IN_DAY } from "./helpers";
import type { CalendarEvent } from "./types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridViewProps {
  days: Date[];
  events: CalendarEvent[];
}

function useScrollbarWidth(ref: RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => setWidth(el.offsetWidth - el.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export function TimeGridView({ days, events }: TimeGridViewProps) {
  const { requestEventCreate } = useCalendarContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarWidth = useScrollbarWidth(scrollRef);

  // A fresh plain map (not a useRef) each render, so column DOM node refs
  // are assigned via the callback ref below without mutating ref.current
  // during render.
  const columnRefs = new Map<string, RefObject<HTMLDivElement | null>>(
    days.map((day) => [dayjs(day).format("YYYY-MM-DD"), { current: null }]),
  );

  return (
    <div
      data-slot="time-grid-view"
      className="flex flex-1 flex-col overflow-hidden rounded-lg border"
    >
      <div className="flex border-b">
        <div className="w-14 shrink-0" />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex-1 border-l px-2 py-1.5 text-center">
            <div className="text-[0.625rem] font-medium text-muted-foreground">
              {dayjs(day).format("ddd")}
            </div>
            <div
              className={cn(
                "text-sm font-medium",
                dayjs(day).isSame(dayjs(), "day") && "text-primary",
              )}
            >
              {dayjs(day).format("D")}
            </div>
          </div>
        ))}
        <div className="shrink-0" style={{ width: scrollbarWidth }} />
      </div>

      <AllDayRow
        days={days}
        events={events}
        scrollbarWidth={scrollbarWidth}
        onCreate={(day) =>
          requestEventCreate({
            start: dayjs(day).startOf("day").toDate(),
            end: dayjs(day).endOf("day").toDate(),
            allDay: true,
          })
        }
      />

      <div ref={scrollRef} className="flex flex-1 overflow-y-auto">
        <div className="w-14 shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b pr-2 text-right text-[0.625rem] text-muted-foreground"
            >
              {dayjs().hour(hour).minute(0).format("h A")}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayKey = dayjs(day).format("YYYY-MM-DD");
          const dayEvents = getEventsForDay(events, day).filter((event) => !event.allDay);
          const isToday = dayjs(day).isSame(dayjs(), "day");

          const columnRef = columnRefs.get(dayKey)!;

          return (
            <div
              key={dayKey}
              ref={(el) => {
                columnRef.current = el;
              }}
              data-drop-day={dayKey}
              className="relative flex-1"
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  data-drop-day={dayKey}
                  data-drop-minutes={hour * 60}
                  className="h-16 border-b border-l cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const start = dayjs(day).startOf("day").set("hours", hour);
                    requestEventCreate({
                      start: start.toDate(),
                      end: start.add(1, "hour").toDate(),
                    });
                  }}
                />
              ))}
              {isToday && <CurrentTimeIndicator />}
              {dayEvents.map((event) => (
                <EventBlock key={event.id} event={event} day={day} columnRef={columnRef} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllDayRow({
  days,
  events,
  scrollbarWidth,
  onCreate,
}: {
  days: Date[];
  events: CalendarEvent[];
  scrollbarWidth: number;
  onCreate: (day: Date) => void;
}) {
  const { t } = useTranslation("calendar");

  return (
    <div className="flex border-b">
      <div className="flex w-14 shrink-0 items-center justify-end pr-2 text-right text-[0.625rem] text-muted-foreground">
        {t("All day")}
      </div>
      {days.map((day) => (
        <div
          key={day.toISOString()}
          onClick={() => onCreate(day)}
          className="flex min-h-8 flex-1 flex-col gap-0.5 border-l p-1 cursor-pointer hover:bg-accent transition-colors"
        >
          {getEventsForDay(events, day)
            .filter((event) => event.allDay)
            .map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
        </div>
      ))}
      <div className="shrink-0" style={{ width: scrollbarWidth }} />
    </div>
  );
}

function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const topPercent = ((now.hour() * 60 + now.minute()) / MINUTES_IN_DAY) * 100;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex items-center gap-1"
      style={{ top: `${topPercent}%` }}
    >
      <div className="size-1.5 shrink-0 rounded-full bg-destructive" />
      <div className="h-px flex-1 bg-destructive" />
    </div>
  );
}
