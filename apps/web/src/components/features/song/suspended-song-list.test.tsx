import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));

import { SuspendedSongList } from "./suspended-song-list";
import * as songResource from "@/services/resources/song";

function makeSong(overrides: Partial<songResource.Song> = {}): songResource.Song {
  return {
    id: "song-1",
    title: "Empty Road",
    artist: "The Wayfinders",
    bpm: 96,
    key: "A minor",
    lyrics: null,
    type: "original",
    organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
    createdAt: new Date().toISOString(),
    createdBy: "user-1",
    createdByName: "Mr Me",
    updatedBy: null,
    updatedAt: null,
    ...overrides,
  };
}

function renderWithSongs(songs: songResource.Song[], onSongCreated = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    songResource.getSongsQueryOptions({ organizationId: "org-1" }).queryKey,
    songs,
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedSongList
        organizationId="org-1"
        projectSlug="acme-inc"
        onSongCreated={onSongCreated}
      />
    </QueryClientProvider>,
  );
}

describe("SuspendedSongList", () => {
  it("shows an empty state when there are no songs", async () => {
    renderWithSongs([]);
    expect(await screen.findByText("No songs yet.")).toBeInTheDocument();
  });

  it("lists every song by title", async () => {
    renderWithSongs([makeSong(), makeSong({ id: "song-2", title: "Second Song", artist: null })]);
    expect(await screen.findByText("Empty Road")).toBeInTheDocument();
    expect(screen.getByText("Second Song")).toBeInTheDocument();
  });

  it("opens the create dialog from the New song button", async () => {
    const user = userEvent.setup();
    renderWithSongs([]);

    await screen.findByText("No songs yet.");
    await user.click(screen.getByRole("button", { name: "New song" }));

    expect(screen.getByRole("heading", { name: "New song" })).toBeInTheDocument();
  });
});
