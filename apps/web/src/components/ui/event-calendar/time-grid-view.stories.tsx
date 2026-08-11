import type { Meta, StoryObj } from "@storybook/react";
import dayjs from "dayjs";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { TimeGridView } from "./time-grid-view";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: Math.random().toString(36),
    title: "Event",
    startDate: new Date(),
    endDate: new Date(),
    color: "blue",
    type: null,
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: new Date(),
    ...overrides,
  };
}

const today = dayjs().hour(9).minute(0).second(0).millisecond(0);
const days = [today.toDate(), today.add(1, "day").toDate(), today.add(2, "day").toDate()];

const meta = {
  title: "UI/EventCalendar/TimeGridView",
  component: TimeGridView,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CalendarContext.Provider value={noopContext}>
        <div className="flex h-[600px] flex-col p-4">
          <Story />
        </div>
      </CalendarContext.Provider>
    ),
  ],
} satisfies Meta<typeof TimeGridView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    days,
    events: [
      makeEvent({
        title: "Standup",
        startDate: today.toDate(),
        endDate: today.add(30, "minute").toDate(),
      }),
      makeEvent({
        title: "Rehearsal",
        color: "purple",
        startDate: today.add(1, "day").hour(19).toDate(),
        endDate: today.add(1, "day").hour(21).toDate(),
      }),
      makeEvent({
        title: "Conference",
        allDay: true,
        color: "orange",
        startDate: today.startOf("day").toDate(),
        endDate: today.add(1, "day").endOf("day").toDate(),
      }),
    ],
  },
};

export const Empty: Story = {
  args: { days, events: [] },
};
