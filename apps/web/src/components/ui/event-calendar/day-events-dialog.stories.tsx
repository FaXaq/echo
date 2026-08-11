import type { Meta, StoryObj } from "@storybook/react";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { DayEventsDialog } from "./day-events-dialog";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Standup",
    startDate: new Date("2026-08-03T09:00:00"),
    endDate: new Date("2026-08-03T09:30:00"),
    color: "blue",
    type: null,
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: new Date("2026-08-01T09:00:00"),
  },
  {
    id: "2",
    title: "Rehearsal",
    startDate: new Date("2026-08-03T19:00:00"),
    endDate: new Date("2026-08-03T21:00:00"),
    color: "purple",
    type: "rehearsal",
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: new Date("2026-08-01T09:00:00"),
  },
];

const meta = {
  title: "UI/EventCalendar/DayEventsDialog",
  component: DayEventsDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <Story />
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof DayEventsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { day: new Date("2026-08-03"), events, onOpenChange: () => {} },
};

export const NoEvents: Story = {
  args: { day: new Date("2026-08-03"), events: [], onOpenChange: () => {} },
};
