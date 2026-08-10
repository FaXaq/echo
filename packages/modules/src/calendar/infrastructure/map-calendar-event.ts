import type { DB } from "@echo/db";
import {
  eventTypeSchema,
  type CalendarEvent,
  type EventColor,
  type EventPlace,
  type EventType,
} from "../domain/index.js";
import type { Selectable } from "kysely";

export type CalendarEventRow = Selectable<DB["calendar_event"]> & {
  created_by_name: string;
  organization_name: string;
  organization_slug: string;
};

function toEventPlace(row: CalendarEventRow): EventPlace | null {
  if (
    row.place_name === null ||
    row.place_address === null ||
    row.place_lat === null ||
    row.place_lng === null
  ) {
    return null;
  }

  return {
    name: row.place_name,
    address: row.place_address,
    lat: row.place_lat,
    lng: row.place_lng,
  };
}

function toEventType(value: string | null): EventType | null {
  return value === null ? null : eventTypeSchema.parse(value);
}

export function toCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day ?? false,
    color: row.color as EventColor,
    type: toEventType(row.type),
    organization: {
      id: row.organization_id,
      name: row.organization_name,
      slug: row.organization_slug,
    },
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    updatedBy: row.updated_by,
    place: toEventPlace(row),
  };
}
