import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { EventCard } from "./event-card"
import type { CalendarEvent } from "./types"

interface DayEventsDialogProps {
  day: Date | null
  events: CalendarEvent[]
  onOpenChange: (open: boolean) => void
}

export function DayEventsDialog({
  day,
  events,
  onOpenChange,
}: DayEventsDialogProps) {
  const { t } = useTranslation("calendar")
  const title = t("Events on {{date}}", {
    date: day ? dayjs(day).format("MMMM D, YYYY") : "",
  })

  return (
    <Dialog open={day !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
