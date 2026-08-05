import dayjs from "dayjs"

import { cn } from "@/lib/utils"

import { useCalendarContext } from "./calendar-context"
import { eventColorClasses } from "./colors"
import { EventTypeIcon } from "./event-types"
import type { CalendarEvent } from "./types"
import { useEventDrag } from "./use-event-drag"

interface EventCardProps {
  event: CalendarEvent
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const { requestEventClick, requestEventMove } = useCalendarContext()

  const { isDragging, dragHandlers } = useEventDrag({
    onClick: () => requestEventClick(event),
    onDrop: (target) => {
      const original = dayjs(event.startDate)
      const targetDay = dayjs(target.day, "YYYY-MM-DD")
      if (targetDay.isSame(original, "day")) return

      const newStart = targetDay
        .hour(original.hour())
        .minute(original.minute())
        .second(0)
        .millisecond(0)
      requestEventMove(event, newStart.toDate())
    },
  })

  return (
    <button
      type="button"
      data-slot="event-card"
      {...dragHandlers}
      onClick={(e) => {
        e.stopPropagation()
        if (e.detail === 0) requestEventClick(event)
      }}
      className={cn(
        "flex w-full touch-none items-center gap-1.5 truncate rounded-sm px-1.5 py-0.5 text-left text-[0.6875rem] font-medium transition-opacity cursor-pointer hover:opacity-50",
        eventColorClasses[event.color],
        isDragging && "opacity-50",
        className
      )}
    >
      {!event.allDay && (
        <span className="shrink-0 tabular-nums opacity-80">
          {dayjs(event.startDate).format("h:mm A")}
        </span>
      )}
      {event.type && <EventTypeIcon type={event.type} className="size-3" />}
      <span className="truncate">{event.title}</span>
    </button>
  )
}
