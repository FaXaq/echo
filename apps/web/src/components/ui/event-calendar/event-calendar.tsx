import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AgendaView } from "./agenda-view";
import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { DayEventsDialog } from "./day-events-dialog";
import { DayView } from "./day-view";
import { EventDialog, type EventDialogState } from "./event-dialog";
import {
  currentHourRange,
  formatDayTitle,
  formatMonthTitle,
  formatWeekRangeTitle,
  moveEventToStart,
  resizeEventEnd,
} from "./helpers";
import { MonthView } from "./month-view";
import type { CalendarEvent, CalendarView } from "./types";
import { WeekView } from "./week-view";

const VIEWS: CalendarView[] = ["month", "week", "day", "agenda"];

const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
};

function titleForView(view: CalendarView, date: Date): string {
  switch (view) {
    case "month":
      return formatMonthTitle(date);
    case "week":
      return formatWeekRangeTitle(date);
    case "day":
      return formatDayTitle(date);
    case "agenda":
      return formatMonthTitle(date);
  }
}

function stepDate(view: CalendarView, date: Date, direction: 1 | -1): Date {
  const unit = view === "month" || view === "agenda" ? "month" : view === "week" ? "week" : "day";
  return dayjs(date).add(direction, unit).toDate();
}

export interface EventCalendarProps {
  events: CalendarEvent[];
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  date?: Date;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (event: CalendarEvent) => void | Promise<void>;
  onEventUpdate?: (event: CalendarEvent) => void | Promise<void>;
  onEventDelete?: (id: string) => void | Promise<void>;
  defaultOrganizationId?: string | null;
  className?: string;
}

export function EventCalendar({
  events,
  view: controlledView,
  onViewChange,
  date: controlledDate,
  onDateChange,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  defaultOrganizationId,
  className,
}: EventCalendarProps) {
  const { t } = useTranslation("calendar");

  const [internalView, setInternalView] = useState<CalendarView>("month");
  const [internalDate, setInternalDate] = useState<Date>(() => new Date());
  const [dialogState, setDialogState] = useState<EventDialogState>(null);
  const [dayOverflow, setDayOverflow] = useState<{
    day: Date;
    events: CalendarEvent[];
  } | null>(null);

  const view = controlledView ?? internalView;
  const date = controlledDate ?? internalDate;

  const setView = (next: CalendarView) => {
    setInternalView(next);
    onViewChange?.(next);
  };

  const setDate = (next: Date) => {
    setInternalDate(next);
    onDateChange?.(next);
  };

  const contextValue = useMemo<CalendarContextValue>(
    () => ({
      requestEventClick: (event) => {
        setDayOverflow(null);
        onEventClick?.(event);
      },
      requestEventCreate: (range) => {
        setDayOverflow(null);
        setDialogState({ mode: "create", range });
      },
      requestEventMove: (event, target) => {
        onEventUpdate?.(moveEventToStart(event, target));
      },
      requestEventResize: (event, newEndDate) => {
        onEventUpdate?.(resizeEventEnd(event, newEndDate));
      },
      requestDayOverflow: (day, dayEvents) => setDayOverflow({ day, events: dayEvents }),
    }),
    [onEventClick, onEventUpdate],
  );

  return (
    <CalendarContext.Provider value={contextValue}>
      <div
        data-slot="event-calendar"
        className={cn("flex h-full min-h-0 flex-col gap-3", className)}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDate(new Date())}>
              {t("Today")}
            </Button>
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Previous")}
                onClick={() => setDate(stepDate(view, date, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Next")}
                onClick={() => setDate(stepDate(view, date, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <h2 className="text-sm font-medium">{titleForView(view, date)}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(next) => setView(next as CalendarView)}>
              <TabsList>
                {VIEWS.map((v) => (
                  <TabsTrigger key={v} value={v}>
                    {t(VIEW_LABELS[v])}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setDialogState({
                  mode: "create",
                  range: currentHourRange(date),
                })
              }
            >
              <Plus className="size-3.5" data-icon="inline-start" />
              {t("New event")}
            </Button>
          </div>
        </div>

        {view === "month" && <MonthView date={date} events={events} />}
        {view === "week" && <WeekView date={date} events={events} />}
        {view === "day" && <DayView date={date} events={events} />}
        {view === "agenda" && <AgendaView date={date} events={events} />}

        <EventDialog
          state={dialogState}
          defaultOrganizationId={defaultOrganizationId}
          onOpenChange={(open) => !open && setDialogState(null)}
          onSubmit={async (event) => {
            await onEventCreate?.(event);
            setDialogState(null);
          }}
          onDelete={async (id) => {
            await onEventDelete?.(id);
            setDialogState(null);
          }}
        />

        <DayEventsDialog
          day={dayOverflow?.day ?? null}
          events={dayOverflow?.events ?? []}
          onOpenChange={(open) => !open && setDayOverflow(null)}
        />
      </div>
    </CalendarContext.Provider>
  );
}
