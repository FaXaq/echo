import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { EventBlock } from "./event-block";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

const day = new Date("2026-08-03");

const baseEvent: CalendarEvent = {
  id: "1",
  title: "Rehearsal",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-03T10:30:00"),
  color: "blue",
  type: "rehearsal",
  organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
  place: null,
  createdBy: "user-1",
  createdByName: "Jane Doe",
  createdAt: new Date("2026-08-01T09:00:00"),
};

function EventBlockDemo({ event }: { event: CalendarEvent }) {
  const columnRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={columnRef} className="relative h-96 w-48 rounded-lg border">
      <EventBlock event={event} day={day} columnRef={columnRef} />
    </div>
  );
}

const meta = {
  title: "UI/EventCalendar/EventBlock",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <Story />
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof EventBlockDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <EventBlockDemo event={baseEvent} />,
};

export const LongEvent: Story = {
  render: () => (
    <EventBlockDemo
      event={{
        ...baseEvent,
        title: "Full day workshop",
        startDate: new Date("2026-08-03T08:00:00"),
        endDate: new Date("2026-08-03T18:00:00"),
        color: "orange",
      }}
    />
  ),
};
