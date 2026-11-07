type EventTiming = { startDate: string | Date; endDate: string | Date; allDay: boolean };

export function formatEventWhen(event: EventTiming, locale: string) {
  const format = new Intl.DateTimeFormat(
    locale,
    event.allDay ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" },
  );
  return format.formatRange(new Date(event.startDate), new Date(event.endDate));
}
