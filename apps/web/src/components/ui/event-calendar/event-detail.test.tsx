import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import dayjs from "dayjs"
import { describe, expect, it, vi } from "vitest"

import { EventDetail } from "./event-detail"
import type { CalendarEvent } from "./types"

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Standup",
    startDate: dayjs().hour(9).minute(0).second(0).millisecond(0).toDate(),
    endDate: dayjs().hour(9).minute(30).second(0).millisecond(0).toDate(),
    color: "blue",
    ...overrides,
  }
}

describe("EventDetail", () => {
  it("renders the event title and description", () => {
    const event = makeEvent({ description: "Daily sync" })
    render(
      <EventDetail
        event={event}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Standup" })
    ).toBeInTheDocument()
    expect(screen.getByText("Daily sync")).toBeInTheDocument()
  })

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={onBack}
      />
    )

    await user.click(screen.getByRole("button", { name: "Back to calendar" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onBack={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Delete" })
    )

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
