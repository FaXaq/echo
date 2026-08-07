import { z } from "zod";

export const eventTypeSchema = z.enum([
  "unavailability",
  "rehearsal",
  "concert",
  "meeting",
  "class",
]);
export type EventType = z.infer<typeof eventTypeSchema>;
export const EVENT_TYPES: EventType[] = eventTypeSchema.options;

export type EventColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange";

export const EVENT_COLORS: EventColor[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
];

export type EventPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: EventColor;
  type: EventType | null;
  organization: {
    id: string,
    name: string,
    slug: string,
  } | undefined;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedBy: string | null;
  place: EventPlace | null;
};

export function isValidEventRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}
