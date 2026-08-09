import { useState } from "react"
import "@/lib/dayjs"
import dayjs from "dayjs"
import { MapPin, MoreVertical, Share2, Timer, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { capitalize } from "remeda"
import { Link } from "@tanstack/react-router"

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
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { getInitials } from "@/lib/remeda"
import { eventDotClasses } from "./colors"
import { getEventLabel, EventTypeIcon } from "./event-types"
import type { CalendarEvent } from "./types"
import { ScrollArea, ScrollBar } from "../scroll-area"

export interface EventDetailProps {
  event: CalendarEvent
  onShare: () => void
  onEdit: () => void
  onDelete: () => void
  attachments: React.ReactNode
  className?: string
}

export function EventDetail({
  event,
  onShare,
  onEdit,
  onDelete,
  attachments,
  className,
}: EventDetailProps) {
  const { t } = useTranslation("calendar")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
    <>
    <div data-slot="event-detail" className={cn("flex flex-wrap-reverse gap-9 h-full", className)}>
      <ScrollArea className="h-full min-w-70 flex-[999_1_400px] pr-4">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {"name" in event.organization && (
                <Link
                  to="/organizations/$organizationSlug"
                  params={{ organizationSlug: event.organization.slug }}
                  className="flex items-center gap-1.5 font-medium text-foreground"
                >
                  <Avatar size="sm" className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(event.organization.name)}
                    </AvatarFallback>
                  </Avatar>
                  {event.organization.name}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("Share")} onClick={onShare}>
                <Share2 />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" size="icon-sm" aria-label={t("Event actions")} />
                  }
                >
                  <MoreVertical />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>{t("Update")}</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    {t("Delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={cn("block size-2.5 shrink-0 rounded-[3px]", eventDotClasses[event.color])} />
            <h1 className="m-0 text-[clamp(22px,4vw,26px)] leading-tight font-semibold tracking-tight">
              {event.title}
            </h1>
          </div>

          {event.description && (
            <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>
          )}

          <Separator />

          <ScrollArea className="w-full shrink-0 pb-4 lg:hidden">
            <div className="flex flex-row gap-1.5">
              <Badge variant="secondary">
                <User data-icon="inline-start" />
                {event.createdByName}
              </Badge>
              <Badge variant="secondary">
                <Timer data-icon="inline-start" />
                {dayjs(event.startDate).format("LLL")}
              </Badge>
              {event.place && (
                <Badge variant="secondary">
                  <MapPin data-icon="inline-start" />
                  {event.place.name}
                </Badge>
              )}
              <Badge variant="secondary">
                <EventTypeIcon type={event.type} className="size-3.5" data-icon="inline-start" />
                {t(getEventLabel(event.type))}
              </Badge>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {attachments}
        </div>
      </ScrollArea>

      <div className="flex w-280px flex-[1_1_220px] flex-col hidden lg:block">
        <div className="flex items-center justify-between gap-2 px-1 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">{t("Organizer")}</span>
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm" className="h-5 w-5">
              <AvatarFallback className="text-[10px]">{getInitials(event.createdByName)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-[13px] font-medium">{event.createdByName}</span>
          </div>
        </div>
        <Separator />

        <div className="flex items-start justify-between gap-2 px-1 py-2.5">
          <span className="pt-px text-xs font-medium text-muted-foreground">{t("Date")}</span>
          <div className="text-right">
            <div className="text-[13px] font-medium">{dateLabel}</div>
            <div className="text-xs text-muted-foreground">{timeLabel}</div>
          </div>
        </div>
        <Separator />

        <div className="flex items-start justify-between gap-2 px-1 py-2.5">
          <span className="pt-px text-xs font-medium text-muted-foreground">{t("Location")}</span>
          <div className="text-right">
            {event.place ? (
              <>
                <div className="text-[13px] font-medium">{event.place.name}</div>
                <div className="text-xs text-muted-foreground">{event.place.address}</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.place.lat},${event.place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                >
                  {t("Open in Maps")}
                </a>
              </>
            ) : (
              <div className="text-[13px] font-medium">—</div>
            )}
          </div>
        </div>
        <Separator />

        <div className="flex items-center justify-between gap-2 px-1 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">{t("Category")}</span>
          <Badge variant="secondary">
            <EventTypeIcon type={event.type} className="size-3.5" data-icon="inline-start" />
            {t(getEventLabel(event.type))}
          </Badge>
        </div>
      </div>
    </div>

    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete event?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("This will permanently delete this event. This action cannot be undone.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setDeleteConfirmOpen(false)
              onDelete()
            }}
          >
            {t("Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
