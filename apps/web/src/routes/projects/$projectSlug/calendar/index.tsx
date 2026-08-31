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

export const Route = createFileRoute("/projects/$projectSlug/calendar/")({
  validateSearch: z.object({
    view: calendarViewSchema.optional().catch(undefined),
    date: z.string().optional().catch(undefined),
  }),
  component: OrganizationCalendarPage,
});

function OrganizationCalendarPage() {
  const { t } = useLingui();
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: events = [] } = useQuery(getEventsQueryOptions({ organizationId }));

  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation({ organizationId });

  const view = search.view ?? "month";
  const date = search.date ? (parseCalendarDate(search.date) ?? new Date()) : new Date();

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
    navigate({
      to: "/projects/$projectSlug/calendar/$eventId",
      params: { projectSlug, eventId: event.id },
    });
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
        defaultOrganizationId={organizationId}
        className="flex-1"
      />
    </div>
  );
}
