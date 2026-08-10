import type { CalendarEvent as ViewEvent, EventPlace } from "@/ui/event-calendar";
import type { CalendarEvent as ApiEvent } from "@/services/resources/calendar";

export function toViewEvent(event: ApiEvent): ViewEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    allDay: event.allDay,
    color: event.color,
    type: event.type,
    organization: event.organization ?? { id: null },
    place: event.place,
    createdBy: event.createdBy,
    createdByName: event.createdByName,
    createdAt: new Date(event.createdAt),
  };
}

export type EventFormValues = {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  color: ViewEvent["color"];
  type: ViewEvent["type"];
  organizationId?: string;
  place: EventPlace | null;
};

export function fromViewEvent(event: ViewEvent): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    allDay: event.allDay,
    color: event.color,
    type: event.type,
    organizationId: event.organization.id ?? undefined,
    place: event.place,
  };
}
