import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EventCalendar } from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent } from "@/ui/event-calendar";
import {
  key as calendarKey,
  getUserEventsQueryOptions,
  createUserEvent,
  updateUserEvent,
  deleteUserEvent,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation("calendar");
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery(getUserEventsQueryOptions());

  const refresh = () => queryClient.invalidateQueries({ queryKey: calendarKey });

  const handleEventCreate = async (event: ViewEvent) => {
    await createUserEvent(fromViewEvent(event));
    refresh();
  };

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateUserEvent({ id: event.id, ...fromViewEvent(event) });
    refresh();
  };

  const handleEventDelete = async (id: string) => {
    await deleteUserEvent({ id });
    refresh();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("Calendar")}</h1>
        <p className="text-muted-foreground">
          {t("Manage your personal events and calendar")}
        </p>
      </div>
      <EventCalendar
        events={events.map(toViewEvent)}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  );
}
