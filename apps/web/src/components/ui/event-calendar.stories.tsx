import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import dayjs from "dayjs";

import {
  EventCalendar,
  type CalendarEvent,
  type CalendarView,
} from "@/components/ui/event-calendar";

const meta = {
  title: "UI/EventCalendar",
  component: EventCalendar,
  args: {
    events: [],
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeSampleEvents(): CalendarEvent[] {
  const today = dayjs().hour(9).minute(0).second(0).millisecond(0);

  return [
    {
      id: "1",
      title: "Team standup",
      startDate: today.toDate(),
      endDate: today.add(30, "minute").toDate(),
      color: "blue",
      organizationId: null,
      place: null,
    },
    {
      id: "2",
      title: "Design review",
      description: "Walk through the new onboarding flow",
      startDate: today.add(2, "hour").toDate(),
      endDate: today.add(3, "hour").toDate(),
      color: "purple",
      organizationId: null,
      place: null,
    },
    {
      id: "3",
      title: "Lunch with Sam",
      startDate: today.add(4, "hour").toDate(),
      endDate: today.add(5, "hour").toDate(),
      color: "green",
      organizationId: null,
      place: null,
    },
    {
      id: "4",
      title: "Conference",
      allDay: true,
      startDate: today.startOf("day").toDate(),
      endDate: today.add(2, "day").endOf("day").toDate(),
      color: "orange",
      organizationId: null,
      place: null,
    },
    {
      id: "5",
      title: "1:1 with manager",
      startDate: today.add(1, "day").hour(11).minute(0).toDate(),
      endDate: today.add(1, "day").hour(11).minute(30).toDate(),
      color: "red",
      organizationId: null,
      place: null,
    },
    {
      id: "6",
      title: "Release cut",
      startDate: today.add(3, "day").hour(14).minute(0).toDate(),
      endDate: today.add(3, "day").hour(15).minute(0).toDate(),
      color: "yellow",
      organizationId: null,
      place: null,
    },
  ];
}

function makeOverflowEvents(): CalendarEvent[] {
  const today = dayjs().hour(8).minute(0).second(0).millisecond(0);

  return Array.from({ length: 8 }, (_, i) => ({
    id: `overflow-${i}`,
    title: `Meeting ${i + 1}`,
    startDate: today.add(i, "hour").toDate(),
    endDate: today.add(i, "hour").add(45, "minute").toDate(),
    color: (["blue", "green", "red", "yellow", "purple", "orange"] as const)[
      i % 6
    ],
    organizationId: null,
    place: null,
  }));
}

function CalendarDemo({
  initialEvents,
  initialView = "month",
}: {
  initialEvents: CalendarEvent[];
  initialView?: CalendarView;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<CalendarView>(initialView);
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="h-[800px] p-4">
      <EventCalendar
        events={events}
        view={view}
        onViewChange={setView}
        date={date}
        onDateChange={setDate}
        onEventCreate={(event) => setEvents((prev) => [...prev, event])}
        onEventUpdate={(event) =>
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? event : e))
          )
        }
        onEventDelete={(id) =>
          setEvents((prev) => prev.filter((e) => e.id !== id))
        }
      />
    </div>
  );
}

export const MonthView: Story = {
  render: () => <CalendarDemo initialEvents={makeSampleEvents()} />,
};

export const WeekView: Story = {
  render: () => (
    <CalendarDemo initialEvents={makeSampleEvents()} initialView="week" />
  ),
};

export const DayView: Story = {
  render: () => (
    <CalendarDemo initialEvents={makeSampleEvents()} initialView="day" />
  ),
};

export const AgendaView: Story = {
  render: () => (
    <CalendarDemo initialEvents={makeSampleEvents()} initialView="agenda" />
  ),
};

export const Empty: Story = {
  render: () => <CalendarDemo initialEvents={[]} />,
};

export const OverflowDay: Story = {
  render: () => <CalendarDemo initialEvents={makeOverflowEvents()} />,
};
