import { eventTypeSchema, type CalendarEvent, type EventColor, type EventPlace, type EventType } from "../domain/index.js";

export type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  all_day: boolean | null;
  color: string;
  type: string | null;
  organization_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  place_name: string | null;
  place_address: string | null;
  place_lat: number | null;
  place_lng: number | null;
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
    organizationId: row.organization_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    place: toEventPlace(row),
  };
}
