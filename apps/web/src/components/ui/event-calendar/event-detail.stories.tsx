import type { Meta, StoryObj } from "@storybook/react";

import { EventDetail } from "./event-detail";

const meta = {
  title: "UI/EventDetail",
  component: EventDetail,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseEvent = {
  id: "1",
  title: "Team standup",
  description: "Daily sync on current work and blockers.",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-03T09:30:00"),
  color: "blue",
  type: null,
  place: null,
  organization: { id: "test", name: "test", slug: "test" },
  createdBy: "XXX",
  createdByName: "Mr Me",
  createdAt: new Date("2026-08-02T09:30:00"),
} as const;

const sharedArgs = {
  onShare: () => {},
  onEdit: () => {},
  onDelete: () => {},
  attachments: <div className="text-xs text-muted-foreground">Attachments render here</div>,
};

export const Default: Story = {
  args: { event: baseEvent, ...sharedArgs },
};

export const AllDay: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "Company offsite",
      description: "Full-day offsite, no meetings.",
      allDay: true,
      color: "purple",
    },
    ...sharedArgs,
  },
};

export const NoDescription: Story = {
  args: { event: { ...baseEvent, description: undefined, color: "green" }, ...sharedArgs },
};

export const WithPlace: Story = {
  args: {
    event: {
      ...baseEvent,
      place: {
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      },
    },
    ...sharedArgs,
  },
};
