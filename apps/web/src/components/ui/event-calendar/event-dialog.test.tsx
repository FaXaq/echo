import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import dayjs from "dayjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EventDialog } from "./event-dialog"
import type { CalendarEvent } from "./types"
import * as organizationResource from "@/services/resources/organization"

const sampleOrganizations = [{ id: "org-1", name: "Acme Inc" }]

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Standup",
    startDate: dayjs().hour(9).minute(0).second(0).millisecond(0).toDate(),
    endDate: dayjs().hour(9).minute(30).second(0).millisecond(0).toDate(),
    color: "blue",
    organizationId: "org-1",
    place: null,
    ...overrides,
  }
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventDialog", () => {
  beforeEach(() => {
    vi.spyOn(organizationResource, "selfListOrganizations").mockReturnValue({
      queryKey: ["organization", "selfList"],
      queryFn: async () => sampleOrganizations,
    } as never)
  })

  it("shows the Organization field when creating an event", async () => {
    renderWithClient(
      <EventDialog
        state={{ mode: "create", range: { start: new Date(), end: new Date() } }}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(await screen.findByLabelText("Organization")).toBeInTheDocument()
  })

  it("does not show the Organization field when editing an existing event", () => {
    renderWithClient(
      <EventDialog
        state={{ mode: "edit", event: makeEvent() }}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.queryByLabelText("Organization")).not.toBeInTheDocument()
  })
})
