import "@/lib/dayjs";
import dayjs from "dayjs";

export function DateTile({ date }: { date: string }) {
  const day = dayjs(date);

  return (
    <time
      dateTime={date}
      title={day.format("LL")}
      className="flex w-11 flex-col items-center rounded-md border py-1 leading-tight"
    >
      <span className="text-[10px] uppercase text-muted-foreground">{day.format("MMM")}</span>
      <span className="font-heading text-base font-semibold">{day.format("D")}</span>
    </time>
  );
}
