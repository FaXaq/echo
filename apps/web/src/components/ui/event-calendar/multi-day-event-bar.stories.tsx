import type { Meta, StoryObj } from "@storybook/react";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { MultiDayEventBar } from "./multi-day-event-bar";
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
  title: "Band tour",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-07T18:00:00"),
  color: "purple",
  type: "concert",
  organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
  place: null,
  createdBy: "user-1",
  createdByName: "Jane Doe",
  createdAt: new Date("2026-08-01T09:00:00"),
};

const meta = {
  title: "UI/EventCalendar/MultiDayEventBar",
  component: MultiDayEventBar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <div className="relative h-8 w-64">
          <Story />
        </div>
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof MultiDayEventBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    event: baseEvent,
    continuesBefore: false,
    continuesAfter: false,
    style: { insetInlineStart: 0, insetInlineEnd: 0, top: 0 },
  },
};

export const ContinuesBothWays: Story = {
  args: {
    event: baseEvent,
    continuesBefore: true,
    continuesAfter: true,
    style: { insetInlineStart: 0, insetInlineEnd: 0, top: 0 },
  },
};
