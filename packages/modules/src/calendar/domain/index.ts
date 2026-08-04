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
  organizationId: string | null;
  createdBy: string;
  updatedBy: string | null;
  place: EventPlace | null;
};

export function isValidEventRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}
