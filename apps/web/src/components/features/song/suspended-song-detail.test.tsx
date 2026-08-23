import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
  useParams: () => ({ projectSlug: "acme-inc" }),
}));

vi.mock("@/components/ui/lyrics-editor", () => ({
  LyricsEditor: ({
    markdown,
    onChange,
  }: {
    markdown: string;
    onChange: (markdown: string) => void;
  }) => (
    <div>
      <p>{markdown}</p>
      <button type="button" onClick={() => onChange("Final edit before leaving")}>
        Simulate lyrics edit
      </button>
    </div>
  ),
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

  it("flushes a pending lyrics autosave with the latest value on unmount", async () => {
    const updateLyricsMutationFn = vi.fn(async (input: { id: string; lyrics: string | null }) =>
      makeSong(input),
    );
    vi.spyOn(songResource, "useUpdateSongLyricsMutation").mockImplementation(() =>
      useMutation({
        mutationFn: (input: { id: string; lyrics: string | null }) => updateLyricsMutationFn(input),
      }),
    );

    const user = userEvent.setup();
    const { unmount } = renderWithSong(makeSong());

    await screen.findByRole("heading", { name: "Empty Road" });
    await user.click(screen.getByRole("button", { name: "Simulate lyrics edit" }));

    // Unmount immediately, well within the 1s debounce window: the pending
    // save must still fire with the latest value instead of being dropped.
    unmount();

    await waitFor(() =>
      expect(updateLyricsMutationFn).toHaveBeenCalledWith({
        id: "song-1",
        lyrics: "Final edit before leaving",
      }),
    );
  });

  it("does not re-save on unmount once a debounced save has already fired", async () => {
    const updateLyricsMutationFn = vi.fn(async (input: { id: string; lyrics: string | null }) =>
      makeSong(input),
    );
    vi.spyOn(songResource, "useUpdateSongLyricsMutation").mockImplementation(() =>
      useMutation({
        mutationFn: (input: { id: string; lyrics: string | null }) => updateLyricsMutationFn(input),
      }),
    );

    const user = userEvent.setup();
    const { unmount } = renderWithSong(makeSong());

    await screen.findByRole("heading", { name: "Empty Road" });
    await user.click(screen.getByRole("button", { name: "Simulate lyrics edit" }));

    // Let the 1s debounce actually fire and complete the save.
    await waitFor(
      () =>
        expect(updateLyricsMutationFn).toHaveBeenCalledWith({
          id: "song-1",
          lyrics: "Final edit before leaving",
        }),
      { timeout: 2000 },
    );

    // Unmounting well after the save already fired must not re-save: the
    // debounce ref should have been cleared once the timeout ran. Give any
    // (buggy) redundant mutate() call a chance to actually reach the
    // mutation function before asserting it never happened.
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(updateLyricsMutationFn).toHaveBeenCalledTimes(1);
  });
});
