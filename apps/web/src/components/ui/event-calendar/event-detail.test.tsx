import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { EventDetail } from "./event-detail";
import type { CalendarEvent } from "./types";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    title: "Standup",
    startDate: dayjs().hour(9).minute(0).second(0).millisecond(0).toDate(),
    endDate: dayjs().hour(9).minute(30).second(0).millisecond(0).toDate(),
    color: "blue",
    type: null,
    organization: { id: null },
    place: null,
    createdBy: "user-1",
    createdByName: "Mr Me",
    createdAt: new Date(),
    ...overrides,
  };
}

const noop = <div />;

describe("EventDetail", () => {
  it("renders the event title and description", () => {
    const event = makeEvent({ description: "Daily sync" });
    render(
      <EventDetail
        event={event}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    expect(screen.getByRole("heading", { name: "Standup" })).toBeInTheDocument();
    expect(screen.getByText("Daily sync")).toBeInTheDocument();
  });

  it("renders the place with an Open in Maps link when set", () => {
    const event = makeEvent({
      place: {
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      },
    });
    render(
      <EventDetail
        event={event}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    expect(screen.getByText(/Le Duplex/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Open in Maps" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=45.764,4.8357",
    );
  });

  it("calls onShare when the share button is clicked", async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(
      <EventDetail
        event={makeEvent()}
        onShare={onShare}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit when Update is chosen from the actions menu", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <EventDetail
        event={makeEvent()}
        onShare={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Event actions" }));
    await user.click(await screen.findByText("Update"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete after confirming Delete from the actions menu", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <EventDetail
        event={makeEvent()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        attachments={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Event actions" }));
    await user.click(await screen.findByText("Delete"));
    const confirmDialog = await screen.findByRole("alertdialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("shows the event type as the category badge", () => {
    render(
      <EventDetail
        event={makeEvent({ type: "concert" })}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    expect(screen.getByText("Concert")).toBeInTheDocument();
  });

  it("renders the attachments slot", () => {
    render(
      <EventDetail
        event={makeEvent()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={<div data-testid="slot">files here</div>}
      />,
    );

    expect(screen.getByTestId("slot")).toBeInTheDocument();
  });
});
