import type { Meta, StoryObj } from "@storybook/react";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { EventCard } from "./event-card";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

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

const meta = {
  title: "UI/EventCalendar/EventCard",
  component: EventCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <div className="w-64">
          <Story />
        </div>
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof EventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { event: baseEvent },
};

export const AllDay: Story = {
  args: { event: { ...baseEvent, title: "Company offsite", allDay: true, color: "purple" } },
};
