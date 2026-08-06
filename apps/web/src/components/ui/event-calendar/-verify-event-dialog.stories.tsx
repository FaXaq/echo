import type { Meta, StoryObj } from "@storybook/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dayjs from "dayjs"

import { EventDialog } from "./event-dialog"
import type { CalendarEvent } from "./types"

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

const event: CalendarEvent = {
  id: "1",
  title: "test org",
  startDate: dayjs("2026-08-04T05:00:00").toDate(),
  endDate: dayjs("2026-08-05T20:00:00").toDate(),
  color: "blue",
  type: null,
  organizationId: null,
  place: { name: "20 Rue des Ruelles", address: "20 Rue des Ruelles", lat: 0, lng: 0 },
}

const meta = {
  title: "Verify/EventDialog",
  render: () => (
    <QueryClientProvider client={client}>
      <EventDialog
        state={{ mode: "edit", event }}
        onOpenChange={() => {}}
        onSubmit={async () => {}}
        onDelete={async () => {}}
      />
    </QueryClientProvider>
  ),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
