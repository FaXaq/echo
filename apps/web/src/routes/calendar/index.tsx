import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { EventCalendar } from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent } from "@/ui/event-calendar";
import {
  getUserEventsQueryOptions,
  useCreateUserEventMutation,
  useUpdateUserEventMutation,
  useDeleteUserEventMutation,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";

export const Route = createFileRoute("/calendar/")({
  staticData: { breadcrumb: "Calendar" },
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation("calendar");
  const navigate = useNavigate();
  const { data: events = [] } = useQuery(getUserEventsQueryOptions());

  const createEventMutation = useCreateUserEventMutation();
  const updateEventMutation = useUpdateUserEventMutation();
  const deleteEventMutation = useDeleteUserEventMutation();

  const handleEventCreate = async (event: ViewEvent) => {
    await createEventMutation.mutateAsync(fromViewEvent(event));
  };

  const handleEventUpdate = async (event: ViewEvent) => {
    await updateEventMutation.mutateAsync({ id: event.id, ...fromViewEvent(event) });
  };

  const handleEventDelete = async (id: string) => {
    await deleteEventMutation.mutateAsync({ id });
  };

  const handleEventClick = (event: ViewEvent) => {
    navigate({ to: "/calendar/$eventId", params: { eventId: event.id } });
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
        onEventClick={handleEventClick}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  );
}
