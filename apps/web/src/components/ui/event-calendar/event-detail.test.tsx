import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import dayjs from "dayjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EventDetail } from "./event-detail"
import type { CalendarEvent } from "./types"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}))

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

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventDetail", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never)
  })

  it("renders the event title and description", () => {
    const event = makeEvent({ description: "Daily sync" })
    renderWithClient(
      <EventDetail event={event} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(
      screen.getByRole("heading", { name: "Standup" })
    ).toBeInTheDocument()
    expect(screen.getByText("Daily sync")).toBeInTheDocument()
  })

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={onBack} />
    )

    await user.click(screen.getByRole("button", { name: "Back to calendar" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={onEdit} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={onDelete} onBack={vi.fn()} />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const confirmDialog = await screen.findByRole("alertdialog")
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Delete" })
    )

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it("renders an AudioPlayer for an attached audio file", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
  })
})
