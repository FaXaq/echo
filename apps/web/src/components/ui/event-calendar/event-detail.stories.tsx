import type { Meta, StoryObj } from "@storybook/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { EventDetail } from "./event-detail"
import { getEventFilesQueryOptions } from "@/services/resources/file"

function withEmptyFiles() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(getEventFilesQueryOptions({ eventId: "1" }).queryKey, [])
  return queryClient
}

const meta = {
  title: "UI/EventDetail",
  component: EventDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={withEmptyFiles()}>
        <div className="w-96">
          <Story />
        </div>
      </QueryClientProvider>
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
  type: null,
  organizationId: null,
  place: null,
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
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}
