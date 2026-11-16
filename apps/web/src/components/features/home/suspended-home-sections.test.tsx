import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/lib/test-utils";
import * as calendarResource from "@/services/resources/calendar";
import * as playlistResource from "@/services/resources/playlist";
import * as songResource from "@/services/resources/song";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));

import {
  SuspendedLastEvent,
  SuspendedRecentPlaylists,
  SuspendedRecentSongs,
  SuspendedUpcomingEvents,
} from "./suspended-home-sections";

const props = { organizationId: "org-1", projectSlug: "acme" };

function renderWith(seed: (client: QueryClient) => void, ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  seed(client);
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("home sections", () => {
  it("invites to create the next event when none is planned", async () => {
    renderWith(
      (client) =>
        client.setQueryData(
          calendarResource.getUpcomingEventsQueryOptions({ organizationId: "org-1" }).queryKey,
          [],
        ),
      <SuspendedUpcomingEvents {...props} />,
    );

    expect(await screen.findByText("No upcoming events")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create your next event" })).toBeInTheDocument();
  });

  it("shows an empty state when there is no playlist", async () => {
    renderWith(
      (client) =>
        client.setQueryData(
          playlistResource.getRecentPlaylistsQueryOptions({ organizationId: "org-1" }).queryKey,
          [],
        ),
      <SuspendedRecentPlaylists {...props} />,
    );

    expect(await screen.findByText("No playlists yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New playlist" })).toBeInTheDocument();
  });

  it("invites to create a song when there is none", async () => {
    renderWith(
      (client) =>
        client.setQueryData(
          songResource.getRecentSongsQueryOptions({ organizationId: "org-1" }).queryKey,
          [],
        ),
      <SuspendedRecentSongs {...props} />,
    );

    expect(await screen.findByText("No songs yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New song" })).toBeInTheDocument();
  });

  it("invites to create an event when none is over yet", async () => {
    renderWith(
      (client) =>
        client.setQueryData(
          calendarResource.getLastEventQueryOptions({ organizationId: "org-1" }).queryKey,
          null,
        ),
      <SuspendedLastEvent {...props} />,
    );

    expect(await screen.findByText("No past events yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an event" })).toBeInTheDocument();
  });
});
