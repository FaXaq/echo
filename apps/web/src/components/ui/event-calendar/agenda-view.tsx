import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EventCard } from "./event-card";
import { getEventsForDay } from "./helpers";
import type { CalendarEvent } from "./types";

const AGENDA_DAYS_AHEAD = 30;

interface AgendaViewProps {
  date: Date;
  events: CalendarEvent[];
}

export function AgendaView({ date, events }: AgendaViewProps) {
  const { t } = useTranslation("calendar");

  const groups = Array.from({ length: AGENDA_DAYS_AHEAD }, (_, i) => dayjs(date).add(i, "day"))
    .map((day) => ({ day, events: getEventsForDay(events, day.toDate()) }))
    .filter((group) => group.events.length > 0);

  if (groups.length === 0) {
    return (
      <div
        data-slot="agenda-view"
        className="flex flex-1 items-center justify-center rounded-lg border text-xs text-muted-foreground"
      >
        {t("No events scheduled")}
      </div>
    );
  }

  return (
    <div
      data-slot="agenda-view"
      className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border p-4"
    >
      {groups.map(({ day, events: dayEvents }) => (
        <div key={day.format("YYYY-MM-DD")} className="flex flex-col gap-1.5">
          <h3 className={cn("text-xs font-medium", day.isSame(dayjs(), "day") && "text-primary")}>
            {day.format("dddd LL")}
          </h3>
          <div className="flex flex-col gap-1">
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} className="py-1.5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
