import type { CalendarEvent, EventColor } from "../domain/index.js";

export type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  all_day: boolean | null;
  color: string;
  organization_id: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export function toCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day ?? false,
    color: row.color as EventColor,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}
