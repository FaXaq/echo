import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { EventCalendar, calendarViewSchema } from "@/ui/event-calendar";
import type { CalendarEvent as ViewEvent, CalendarView } from "@/ui/event-calendar";
import {
  getEventsQueryOptions,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "@/services/resources/calendar";
import { toViewEvent, fromViewEvent } from "@/lib/calendar-events";
import { formatCalendarDate, parseCalendarDate } from "@/lib/calendar-date";

export const Route = createFileRoute("/calendar/")({
  validateSearch: z.object({
    view: calendarViewSchema.optional().catch(undefined),
    date: z.string().optional().catch(undefined),
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: events = [] } = useQuery(getEventsQueryOptions());

  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();

  const view = search.view ?? "month";
  const date = search.date ? (parseCalendarDate(search.date) ?? new Date()) : new Date();

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

  const handleViewChange = (nextView: CalendarView) => {
    navigate({
      from: Route.fullPath,
      search: (prev) => ({ ...prev, view: nextView }),
      replace: true,
    });
  };

  const handleDateChange = (nextDate: Date) => {
    navigate({
      from: Route.fullPath,
      search: (prev) => ({ ...prev, date: formatCalendarDate(nextDate) }),
      replace: true,
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t`Calendar`}</h1>
      </div>
      <EventCalendar
        events={events.map(toViewEvent)}
        view={view}
        onViewChange={handleViewChange}
        date={date}
        onDateChange={handleDateChange}
        onEventClick={handleEventClick}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        className="flex-1"
      />
    </div>
  );
}
