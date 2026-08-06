import "@/lib/dayjs"
import dayjs from "dayjs"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { capitalize } from "remeda"

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
import { EVENT_TYPE_LABELS, EventTypeIcon } from "./event-types"
import type { CalendarEvent } from "./types"

export interface EventDetailProps {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
  organizationId?: string
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

  const sameDay = dayjs(event.startDate).isSame(event.endDate, "day")
  const dateLabel = capitalize(dayjs(event.startDate).format("dddd LL"))
  const timeLabel = event.allDay
    ? sameDay
      ? t("All day")
      : `${dayjs(event.startDate).format("LL")} – ${dayjs(event.endDate).format("LL")}`
    : sameDay
      ? `${dayjs(event.startDate).format("LT")} – ${dayjs(event.endDate).format("LT")}`
      : `${dayjs(event.startDate).format("LL, LT")} – ${dayjs(event.endDate).format("LL, LT")}`

  return (
    <div
      data-slot="event-detail"
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="typeset typeset-notes rounded border p-4">
        {(event.type || event.allDay) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {event.type && (
              <Badge variant="secondary">
                <EventTypeIcon
                  type={event.type}
                  className="size-3.5"
                  data-icon="inline-start"
                />
                {t(EVENT_TYPE_LABELS[event.type])}
              </Badge>
            )}
            {event.allDay && <Badge variant="outline">{t("All day")}</Badge>}
          </div>
        )}

        <h1 className="my-4">{event.title}</h1>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-2">
            <Calendar className="text-muted-foreground shrink-0" size={18} />
            <div className="flex flex-col justify-start">
              <p className="m-0">
                <b>{dateLabel}</b>
              </p>
              <p className="m-0 text-muted-foreground">{timeLabel}</p>
            </div>
          </div>

          {event.place && (
            <div className="flex flex-row gap-2">
              <MapPin className="text-muted-foreground shrink-0" size={18} />
              <div className="flex flex-col justify-start">
                <p className="m-0">
                  <b>{event.place.name}</b>
                </p>
                <p className="m-0 text-muted-foreground">
                  {event.place.address}{" "}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.place.lat},${event.place.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("Open in Maps")}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <>
            <hr />
            <p className="whitespace-pre-wrap">{event.description}</p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={onEdit}>
          {t("Edit")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
            {t("Delete")}
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
