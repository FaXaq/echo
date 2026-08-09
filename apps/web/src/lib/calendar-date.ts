import dayjs from "dayjs";

const CALENDAR_DATE_FORMAT = "YYYY-MM-DD";
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatCalendarDate(date: Date): string {
  return dayjs(date).format(CALENDAR_DATE_FORMAT);
}

export function parseCalendarDate(value: string): Date | null {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealCalendarDate ? date : null;
}
