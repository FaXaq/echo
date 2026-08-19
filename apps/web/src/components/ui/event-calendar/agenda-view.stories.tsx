import type { Meta, StoryObj } from "@storybook/react";
import dayjs from "dayjs";

import { AgendaView } from "./agenda-view";
import type { CalendarEvent } from "./types";

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

const meta = {
  title: "UI/EventCalendar/AgendaView",
  component: AgendaView,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex h-[480px] w-[420px] flex-col p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgendaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    date: today.toDate(),
    events: [
      makeEvent({
        title: "Standup",
        startDate: today.toDate(),
        endDate: today.add(30, "minute").toDate(),
      }),
      makeEvent({
        title: "Rehearsal",
        type: "rehearsal",
        color: "purple",
        startDate: today.add(1, "day").hour(19).toDate(),
        endDate: today.add(1, "day").hour(21).toDate(),
      }),
      makeEvent({
        title: "Concert",
        type: "concert",
        color: "red",
        startDate: today.add(4, "day").hour(20).toDate(),
        endDate: today.add(4, "day").hour(23).toDate(),
      }),
    ],
  },
};

export const Empty: Story = {
  args: { date: today.toDate(), events: [] },
};
