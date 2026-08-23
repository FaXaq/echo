import { useState } from "react";
import "@/lib/dayjs";
import dayjs from "dayjs";
import { MapPin, MoreVertical, Share2, Timer, User } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { capitalize } from "remeda";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityDetailLayout, type SidebarItem } from "@/components/ui/entity-detail-layout";
import { getInitials } from "@/lib/remeda";
import { eventDotClasses } from "./colors";
import { getEventLabel, EventTypeIcon } from "./event-types";
import type { CalendarEvent } from "./types";

export interface EventDetailProps {
  event: CalendarEvent;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  attachments: React.ReactNode;
  className?: string;
}

export function EventDetail({
  event,
  onShare,
  onEdit,
  onDelete,
  attachments,
  className,
}: EventDetailProps) {
  const { t } = useLingui();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sameDay = dayjs(event.startDate).isSame(event.endDate, "day");
  const dateLabel = capitalize(dayjs(event.startDate).format("dddd LL"));
  const timeLabel = event.allDay
    ? sameDay
      ? t`All day`
      : `${dayjs(event.startDate).format("LL")} – ${dayjs(event.endDate).format("LL")}`
    : sameDay
      ? `${dayjs(event.startDate).format("LT")} – ${dayjs(event.endDate).format("LT")}`
      : `${dayjs(event.startDate).format("LL, LT")} – ${dayjs(event.endDate).format("LL, LT")}`;

  const sidebarItems: SidebarItem[] = [
    {
      label: t`Organizer`,
      value: (
        <div className="flex min-w-0 items-center gap-1.5">
          <Avatar size="sm" className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {getInitials(event.createdByName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-[13px] font-medium">{event.createdByName}</span>
        </div>
      ),
      badge: (
        <>
          <User data-icon="inline-start" />
          {event.createdByName}
        </>
      ),
    },
    {
      label: t`Date`,
      value: (
        <>
          <div className="text-[13px] font-medium">{dateLabel}</div>
          <div className="text-xs text-muted-foreground">{timeLabel}</div>
        </>
      ),
      badge: (
        <>
          <Timer data-icon="inline-start" />
          {dayjs(event.startDate).format("LLL")}
        </>
      ),
    },
    {
      label: t`Location`,
      value: event.place ? (
        <>
          <div className="text-[13px] font-medium">{event.place.name}</div>
          <div className="text-xs text-muted-foreground">{event.place.address}</div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${event.place.lat},${event.place.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs"
          >
            {t`Open in Maps`}
          </a>
        </>
      ) : (
        <div className="text-[13px] font-medium">—</div>
      ),
      badge: event.place ? (
        <>
          <MapPin data-icon="inline-start" />
          {event.place.name}
        </>
      ) : undefined,
    },
    {
      label: t`Category`,
      value: (
        <Badge variant="secondary">
          <EventTypeIcon type={event.type} className="size-3.5" data-icon="inline-start" />
          {t(getEventLabel(event.type))}
        </Badge>
      ),
      badge: (
        <>
          <EventTypeIcon type={event.type} className="size-3.5" data-icon="inline-start" />
          {t(getEventLabel(event.type))}
        </>
      ),
    },
  ];

  return (
    <>
      <EntityDetailLayout
        organizationName={event.organization.name}
        organizationSlug={event.organization.slug}
        icon={
          <span
            className={cn("block size-2.5 shrink-0 rounded-[3px]", eventDotClasses[event.color])}
          />
        }
        title={event.title}
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t`Share`}
              onClick={onShare}
            >
              <Share2 />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t`Event actions`}
                  />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>{t`Update`}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  {t`Delete`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        sidebarItems={sidebarItems}
        attachments={attachments}
        className={className}
      >
        {event.description && (
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>
        )}
      </EntityDetailLayout>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Delete event?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`This will permanently delete this event. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteConfirmOpen(false);
                onDelete();
              }}
            >
              {t`Delete`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
