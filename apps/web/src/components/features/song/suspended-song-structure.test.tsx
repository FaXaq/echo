import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, render, screen } from "@/lib/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SongStructure, TimeSignature } from "@echo/modules/song/domain";

vi.mock("@/components/ui/song/structure/song-structure-editor", () => ({
  SongStructureEditor: ({
    structure,
    onChange,
  }: {
    structure: SongStructure;
    onChange: (structure: SongStructure) => void;
  }) => (
    <div>
      <p data-testid="count">{structure.sections.length}</p>
      <button type="button" onClick={() => onChange({ sections: [makeSection("a")] })}>
        edit a
      </button>
      <button
        type="button"
        onClick={() => onChange({ sections: [makeSection("a"), makeSection("b")] })}
      >
        edit b
      </button>
    </div>
  ),
}));

const getSongStructure = vi.hoisted(() => vi.fn(async () => ({ sections: [] })));

vi.mock("@/services/api-client", () => ({
  apiClient: { song: { getSongStructure: { query: getSongStructure } } },
}));

import { SuspendedSongStructure } from "./suspended-song-structure";
import * as songResource from "@/services/resources/song";

function makeSection(id: string): SongStructure["sections"][number] {
  return {
    id,
    kind: "verse",
    name: id,
    repeat: 1,
    time: { beats: 4, beatType: 4 },
    bars: [],
    notes: "",
  };
}

const defaultTime: TimeSignature = { beats: 4, beatType: 4 };

function setup() {
  const mutationFn = vi.fn(
    async (input: { id: string; structure: SongStructure }) => input.structure,
  );
  vi.spyOn(songResource, "useUpdateSongStructureMutation").mockImplementation(() =>
    useMutation({
      mutationFn: (input: { id: string; structure: SongStructure }) => mutationFn(input),
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    songResource.getSongStructureQueryOptions({ songId: "song-1", organizationId: "org-1" })
      .queryKey,
    { sections: [] },
  );
  const ui = (
    <QueryClientProvider client={client}>
      <SuspendedSongStructure songId="song-1" organizationId="org-1" defaultTime={defaultTime} />
    </QueryClientProvider>
  );
  const view = render(ui);
  return { mutationFn, client, ui, ...view };
}

const click = (name: string) =>
  act(async () => {
    screen.getByRole("button", { name }).click();
  });

describe("SuspendedSongStructure", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("saves the whole structure once after 600 ms", async () => {
    const { mutationFn } = setup();
    await click("edit a");
    await act(() => vi.advanceTimersByTimeAsync(599));
    expect(mutationFn).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(mutationFn).toHaveBeenCalledWith({
      id: "song-1",
      structure: { sections: [makeSection("a")] },
    });
  });

  it("debounces rapid edits into one save with the latest structure", async () => {
    const { mutationFn } = setup();
    await click("edit a");
    await act(() => vi.advanceTimersByTimeAsync(300));
    await click("edit b");
    await act(() => vi.advanceTimersByTimeAsync(600));
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(mutationFn).toHaveBeenCalledWith({
      id: "song-1",
      structure: { sections: [makeSection("a"), makeSection("b")] },
    });
  });

  it("flushes a pending save on unmount", async () => {
    const { mutationFn, unmount } = setup();
    await click("edit a");
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(mutationFn).toHaveBeenCalledWith({
      id: "song-1",
      structure: { sections: [makeSection("a")] },
    });
  });

  it("keeps edits when the panel is unmounted and remounted", async () => {
    const { unmount, ui } = setup();
    await click("edit b");
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    render(ui);
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("does not refetch the structure on remount", async () => {
    const { unmount, ui } = setup();
    await click("edit a");
    unmount();
    render(ui);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(getSongStructure).not.toHaveBeenCalled();
  });

  it("ignores the mutation response for editor and cache", async () => {
    const { mutationFn, client } = setup();
    mutationFn.mockResolvedValue({
      sections: [makeSection("x"), makeSection("y"), makeSection("z")],
    });
    await click("edit a");
    await act(() => vi.advanceTimersByTimeAsync(600));
    await click("edit b");
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(
      client.getQueryData(
        songResource.getSongStructureQueryOptions({ songId: "song-1", organizationId: "org-1" })
          .queryKey,
      ),
    ).toEqual({ sections: [makeSection("a"), makeSection("b")] });
  });
});
