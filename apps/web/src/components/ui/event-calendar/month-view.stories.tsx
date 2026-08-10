import type { Meta, StoryObj } from "@storybook/react";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { MonthView } from "./month-view";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

const meta = {
  title: "UI/MonthView",
  component: MonthView,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <div className="flex h-[720px] flex-col p-4">
          <Story />
        </div>
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof MonthView>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: Math.random().toString(36),
    title: "Event",
    startDate: new Date("2026-08-03T09:00:00"),
    endDate: new Date("2026-08-03T10:00:00"),
    color: "blue",
    type: null,
    organization: { id: null },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: new Date(),
    ...overrides,
  };
}

export const WithMultiDayEvents: Story = {
  args: {
    date: new Date("2026-08-15"),
    events: [
      makeEvent({
        title: "Standup",
        startDate: new Date("2026-08-04T09:00:00"),
        endDate: new Date("2026-08-04T09:30:00"),
        color: "blue",
      }),
      makeEvent({
        title: "Band tour",
        startDate: new Date("2026-08-03T09:00:00"),
        endDate: new Date("2026-08-07T18:00:00"),
        color: "purple",
      }),
      makeEvent({
        title: "Overnight festival",
        startDate: new Date("2026-08-05T22:00:00"),
        endDate: new Date("2026-08-06T02:00:00"),
        color: "orange",
      }),
      makeEvent({
        title: "Conference",
        startDate: new Date("2026-08-17T09:00:00"),
        endDate: new Date("2026-08-19T17:00:00"),
        color: "green",
      }),
      makeEvent({
        title: "Long overlap A",
        startDate: new Date("2026-08-17T09:00:00"),
        endDate: new Date("2026-08-20T17:00:00"),
        color: "red",
      }),
    ],
  },
};
