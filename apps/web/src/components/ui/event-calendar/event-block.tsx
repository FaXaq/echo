import { type RefObject } from "react"
import dayjs from "dayjs"

import { cn } from "@/lib/utils"

import { useCalendarContext } from "./calendar-context"
import { eventColorClasses } from "./colors"
import { getEventBlockPosition } from "./helpers"
import type { CalendarEvent } from "./types"
import { useEventDrag } from "./use-event-drag"
import { useEventResize } from "./use-event-resize"

interface EventBlockProps {
  event: CalendarEvent
  day: Date
  columnRef: RefObject<HTMLElement | null>
}

export function EventBlock({ event, day, columnRef }: EventBlockProps) {
  const { requestEventClick, requestEventMove, requestEventResize } =
    useCalendarContext()

  const { isDragging, dragHandlers } = useEventDrag({
    onClick: () => requestEventClick(event),
    onDrop: (target) => {
      const targetDay = dayjs(target.day, "YYYY-MM-DD")
      const original = dayjs(event.startDate)
      const targetDate =
        target.minutes != null
          ? targetDay.startOf("day").add(target.minutes, "minute")
          : targetDay.hour(original.hour()).minute(original.minute())
      requestEventMove(event, targetDate.toDate())
    },
  })

  const { isResizing, previewEndDate, resizeHandleProps } = useEventResize({
    containerRef: columnRef,
    day,
    onResizeEnd: (newEndDate) => requestEventResize(event, newEndDate),
  })

  const position = getEventBlockPosition(
    previewEndDate ? { ...event, endDate: previewEndDate } : event,
    day
  )

  return (
    <div
      data-slot="event-block"
      role="button"
      tabIndex={0}
      {...dragHandlers}
      onClick={(e) => {
        e.stopPropagation()
        if (e.detail === 0) requestEventClick(event)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") requestEventClick(event)
      }}
      style={{
        top: `${position.topPercent}%`,
        height: `${position.heightPercent}%`,
      }}
      className={cn(
        "absolute inset-x-0.5 touch-none overflow-hidden rounded-sm px-1.5 py-1 text-left text-[0.6875rem] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        eventColorClasses[event.color],
        (isDragging || isResizing) && "z-10 opacity-70"
      )}
    >
      <p className="truncate">{event.title}</p>
      <p className="truncate tabular-nums opacity-80">
        {dayjs(event.startDate).format("h:mm A")} -{" "}
        {dayjs(previewEndDate ?? event.endDate).format("h:mm A")}
      </p>
      <div
        data-slot="event-block-resize-handle"
        {...resizeHandleProps}
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize touch-none"
      />
    </div>
  )
}
