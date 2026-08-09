import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SuspendedEventDetail } from "./suspended-event-detail";
import * as calendarResource from "@/services/resources/calendar";
import * as fileResource from "@/services/resources/file";

function makeEvent(): calendarResource.CalendarEvent {
  return {
    id: "event-1",
    title: "Standup",
    description: null,
    startDate: "2026-08-03T09:00:00",
    endDate: "2026-08-03T09:30:00",
    allDay: false,
    color: "blue",
    type: null,
    organization: undefined,
    createdAt: "2026-08-02T09:00:00",
    createdBy: "user-1",
    createdByName: "Mr Me",
    updatedBy: null,
    place: null,
  } as calendarResource.CalendarEvent;
}

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <SuspendedEventDetail eventId="event-1" onBack={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("SuspendedEventDetail", () => {
  it("renders the event once loaded", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(
      calendarResource.getEventQueryOptions({ eventId: "event-1" }).queryKey,
      makeEvent(),
    );
    client.setQueryData(
      fileResource.getEventFilesQueryOptions({ eventId: "event-1" }).queryKey,
      [],
    );

    renderWithClient(client);

    expect(await screen.findByRole("heading", { name: "Standup" })).toBeInTheDocument();
  });

  it("shows a not-found screen (not a generic error) when the event lookup 404s", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(
      calendarResource.getEventQueryOptions({ eventId: "event-1" }).queryKey,
      undefined,
    );
    vi.spyOn(calendarResource, "getEventQueryOptions").mockReturnValue({
      queryKey: ["calendar", "getEventById", "event-1"],
      queryFn: async () => {
        throw new TRPCClientError("Not found", {
          result: { error: { data: { code: "NOT_FOUND" } } },
        } as never);
      },
    } as never);

    renderWithClient(client);

    expect(await screen.findByText("Event not found")).toBeInTheDocument();
  });
});
