import type { Meta, StoryObj } from "@storybook/react"

import { EventDetail } from "./event-detail"

const meta = {
  title: "UI/EventDetail",
  component: EventDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventDetail>

export default meta
type Story = StoryObj<typeof meta>

const baseEvent = {
  id: "1",
  title: "Team standup",
  description: "Daily sync on current work and blockers.",
  startDate: new Date("2026-08-03T09:00:00"),
  endDate: new Date("2026-08-03T09:30:00"),
  color: "blue",
} as const

export const Default: Story = {
  args: {
    event: baseEvent,
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const AllDay: Story = {
  args: {
    event: {
      ...baseEvent,
      title: "Company offsite",
      description: "Full-day offsite, no meetings.",
      allDay: true,
      color: "purple",
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const NoDescription: Story = {
  args: {
    event: { ...baseEvent, description: undefined, color: "green" },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}
