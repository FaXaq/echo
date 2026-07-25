import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import dayjs from "dayjs"
import { describe, expect, it, vi } from "vitest"

import { EventCalendar } from "./event-calendar"
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

describe("EventCalendar", () => {
  it("renders in month view by default", () => {
    render(<EventCalendar events={[makeEvent()]} />)
    expect(screen.getByText("Standup")).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "Month", selected: true })
    ).toBeInTheDocument()
  })

  it("switches views via the tab list", async () => {
    const user = userEvent.setup()
    render(<EventCalendar events={[makeEvent()]} />)

    await user.click(screen.getByRole("tab", { name: "Week" }))

    expect(
      screen.getByRole("tab", { name: "Week", selected: true })
    ).toBeInTheDocument()
  })

  it("navigates to the next month and back to today", async () => {
    const user = userEvent.setup()
    render(<EventCalendar events={[]} />)

    const initialTitle = screen.getByRole("heading", { level: 2 }).textContent
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(
      initialTitle
    )

    await user.click(screen.getByRole("button", { name: "Today" }))
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      initialTitle
    )
  })

  it("navigates to the next month in agenda view", async () => {
    const user = userEvent.setup()
    render(<EventCalendar events={[]} />)

    await user.click(screen.getByRole("tab", { name: "Agenda" }))
    const initialTitle = screen.getByRole("heading", { level: 2 }).textContent

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(
      initialTitle
    )
  })

  it("calls onEventClick and does not open a dialog when an event is clicked", async () => {
    const user = userEvent.setup()
    const onEventClick = vi.fn()
    const event = makeEvent()
    render(<EventCalendar events={[event]} onEventClick={onEventClick} />)

    await user.click(screen.getByText("Standup"))

    expect(onEventClick).toHaveBeenCalledWith(event)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("validates and creates a new event from the New event dialog", async () => {
    const user = userEvent.setup()
    const onEventCreate = vi.fn()
    render(<EventCalendar events={[]} onEventCreate={onEventCreate} />)

    await user.click(screen.getByRole("button", { name: /New event/i }))
    const dialog = screen.getByRole("dialog")

    await user.click(within(dialog).getByRole("button", { name: "Save" }))
    expect(
      await within(dialog).findByText("Title is required")
    ).toBeInTheDocument()
    expect(onEventCreate).not.toHaveBeenCalled()

    await user.type(within(dialog).getByLabelText("Title"), "Retro")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(onEventCreate).toHaveBeenCalledTimes(1)
    expect(onEventCreate.mock.calls[0]![0]).toMatchObject({ title: "Retro" })
  })
})
