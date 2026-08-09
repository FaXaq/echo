import { type CSSProperties } from "react";
import dayjs from "dayjs";

import { cn } from "@/lib/utils";

import { useCalendarContext } from "./calendar-context";
import { eventColorClasses } from "./colors";
import { EventTypeIcon } from "./event-types";
import type { CalendarEvent } from "./types";
import { useEventDrag } from "./use-event-drag";

interface MultiDayEventBarProps {
  event: CalendarEvent;
  continuesBefore: boolean;
  continuesAfter: boolean;
  style?: CSSProperties;
}

export function MultiDayEventBar({
  event,
  continuesBefore,
  continuesAfter,
  style,
}: MultiDayEventBarProps) {
  const { requestEventClick, requestEventMove } = useCalendarContext();

  const { isDragging, dragHandlers } = useEventDrag({
    onClick: () => requestEventClick(event),
    onDrop: (target) => {
      const original = dayjs(event.startDate);
      const targetDay = dayjs(target.day, "YYYY-MM-DD");
      if (targetDay.isSame(original, "day")) return;

      const newStart = targetDay
        .hour(original.hour())
        .minute(original.minute())
        .second(0)
        .millisecond(0);
      requestEventMove(event, newStart.toDate());
    },
  });

  return (
    <button
      type="button"
      data-slot="multi-day-event-bar"
      {...dragHandlers}
      onClick={(e) => {
        e.stopPropagation();
        if (e.detail === 0) requestEventClick(event);
      }}
      style={style}
      className={cn(
        "pointer-events-auto absolute flex touch-none items-center gap-1 overflow-hidden px-1.5 py-0.5 text-left text-[0.6875rem] font-medium transition-opacity cursor-pointer hover:opacity-80",
        eventColorClasses[event.color],
        continuesBefore ? "rounded-l-none" : "rounded-l-sm",
        continuesAfter ? "rounded-r-none" : "rounded-r-sm",
        isDragging && "z-20 opacity-70",
      )}
    >
      {event.type && <EventTypeIcon type={event.type} className="size-3 shrink-0" />}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
