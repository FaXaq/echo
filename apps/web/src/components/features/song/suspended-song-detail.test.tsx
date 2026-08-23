import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
  useParams: () => ({ projectSlug: "acme-inc" }),
}));

import { SuspendedSongDetail } from "./suspended-song-detail";
import * as songResource from "@/services/resources/song";
import * as driveResource from "@/services/resources/drive";

function makeSong(overrides: Partial<songResource.Song> = {}): songResource.Song {
  return {
    id: "song-1",
    title: "Empty Road",
    artist: "The Wayfinders",
    bpm: 96,
    key: "A minor",
    lyrics: "Walking down that empty road",
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

function renderWithSong(song: songResource.Song) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    songResource.getSongQueryOptions({ songId: song.id, organizationId: "org-1" }).queryKey,
    song,
  );
  client.setQueryData(
    driveResource.getSongFilesQueryOptions({ songId: song.id, organizationId: "org-1" }).queryKey,
    [],
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedSongDetail
        songId={song.id}
        organizationId="org-1"
        pathname="/acme-inc/songs/song-1"
        onBack={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("SuspendedSongDetail", () => {
  it("renders the loaded song's title and lyrics", async () => {
    renderWithSong(makeSong());

    expect(await screen.findByRole("heading", { name: "Empty Road" })).toBeInTheDocument();
    expect(await screen.findByText(/Walking down that empty road/)).toBeInTheDocument();
  });

  it("opens the edit dialog pre-filled when Update is chosen", async () => {
    const user = userEvent.setup();
    renderWithSong(makeSong());

    await screen.findByRole("heading", { name: "Empty Road" });
    await user.click(screen.getByRole("button", { name: "Song actions" }));
    await user.click(await screen.findByText("Update"));

    expect(screen.getByRole("heading", { name: "Edit song" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Empty Road");
  });
});
