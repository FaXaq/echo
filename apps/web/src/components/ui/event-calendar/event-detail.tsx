import dayjs from "dayjs"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { COLOR_LABELS, eventDotClasses } from "./colors"
import type { CalendarEvent } from "./types"

export interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  className?: string
}

export function EventDetail({
  event,
  onEdit,
  onDelete,
  onBack,
  className,
}: EventDetailProps) {
  const { t } = useTranslation("calendar")

  const dateFormat = event.allDay ? "MMMM D, YYYY" : "MMMM D, YYYY h:mm A"
  const start = dayjs(event.startDate).format(dateFormat)
  const end = dayjs(event.endDate).format(dateFormat)

  return (
    <div
      data-slot="event-detail"
      className={cn("flex flex-col gap-6", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" data-icon="inline-start" />
        {t("Back to calendar")}
      </Button>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2.5 rounded-full", eventDotClasses[event.color])}
          />
          <span className="text-sm text-muted-foreground">
            {t(COLOR_LABELS[event.color])}
          </span>
          {event.allDay && <Badge variant="outline">{t("All day")}</Badge>}
        </div>

        <h1 className="text-2xl font-bold">{event.title}</h1>

        <p className="text-sm text-muted-foreground">
          {start === end ? start : `${start} – ${end}`}
        </p>

        {event.description && (
          <p className="whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={onEdit}>
          {t("Edit")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              {t("Delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Delete event?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will permanently delete this event. This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                {t("Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
