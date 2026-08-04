import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { EventCalendar } from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent } from "@/ui/event-calendar";
import {
  getEventsQueryOptions,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";

export const Route = createFileRoute("/calendar/")({
  staticData: { breadcrumb: "Calendar" },
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation("calendar");
  const navigate = useNavigate();
  const { data: events = [] } = useQuery(getEventsQueryOptions());

  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();

  const handleEventCreate = async (event: ViewEvent) => {
    createEventMutation.mutate(fromViewEvent(event));
  };

  const handleEventUpdate = async (event: ViewEvent) => {
    updateEventMutation.mutate({ id: event.id, ...fromViewEvent(event) });
  };

  const handleEventDelete = async (id: string) => {
    deleteEventMutation.mutate({ id });
  };

  const handleEventClick = (event: ViewEvent) => {
    navigate({ to: "/calendar/$eventId", params: { eventId: event.id } });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("Calendar")}</h1>
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
