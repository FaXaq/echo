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
    type: null,
    organizationId: null,
    place: null,
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

  it("renders the place with an Open in Maps link when set", () => {
    const event = makeEvent({
      place: {
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      },
    })
    renderWithClient(
      <EventDetail event={event} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(screen.getByText(/Le Duplex/)).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Open in Maps" })
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=45.764,4.8357"
    )
  })

  it("does not render a place link when the event has no place", () => {
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(screen.queryByRole("link", { name: "Open in Maps" })).not.toBeInTheDocument()
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

  it("forwards organizationId to EventAttachments for file uploads", async () => {
    const uploadSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: uploadSpy,
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    const user = userEvent.setup()
    renderWithClient(
      <EventDetail
        event={makeEvent()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
        organizationId="org-1"
      />
    )

    const input = await screen.findByLabelText("Add files", { selector: "input" })
    const file = new File(["x"], "demo.mp3", { type: "audio/mpeg" })
    await user.upload(input, file)

    expect(uploadSpy).toHaveBeenCalledWith({ eventId: "1", organizationId: "org-1", file })
  })

  it("shows the event type label when set", () => {
    renderWithClient(
      <EventDetail
        event={makeEvent({ type: "concert" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByText("Concert")).toBeInTheDocument()
  })

  it("does not show a type label when the event has no type", () => {
    renderWithClient(
      <EventDetail event={makeEvent()} onEdit={vi.fn()} onDelete={vi.fn()} onBack={vi.fn()} />
    )

    expect(screen.queryByText("Concert")).not.toBeInTheDocument()
    expect(screen.queryByText("Meeting")).not.toBeInTheDocument()
  })
})
