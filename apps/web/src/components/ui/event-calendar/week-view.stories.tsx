import type { Meta, StoryObj } from "@storybook/react";
import dayjs from "dayjs";

import { CalendarContext, type CalendarContextValue } from "./calendar-context";
import { WeekView } from "./week-view";
import type { CalendarEvent } from "./types";

const noopContext: CalendarContextValue = {
  requestEventClick: () => {},
  requestEventCreate: () => {},
  requestEventMove: () => {},
  requestEventResize: () => {},
  requestDayOverflow: () => {},
};

const today = dayjs().hour(9).minute(0).second(0).millisecond(0);

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Standup",
    startDate: today.toDate(),
    endDate: today.add(30, "minute").toDate(),
    color: "blue",
    type: null,
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: today.toDate(),
  },
  {
    id: "2",
    title: "Rehearsal",
    startDate: today.add(1, "day").hour(19).toDate(),
    endDate: today.add(1, "day").hour(21).toDate(),
    color: "purple",
    type: "rehearsal",
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    place: null,
    createdBy: "user-1",
    createdByName: "Jane Doe",
    createdAt: today.toDate(),
  },
];

const meta = {
  title: "UI/EventCalendar/WeekView",
  component: WeekView,
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
} satisfies Meta<typeof WeekView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { date: today.toDate(), events },
};
