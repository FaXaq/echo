import { render, screen, within } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));

import { SongDetail } from "./song-detail";
import type { Song } from "@/services/resources/song";

function makeSong(overrides: Partial<Song> = {}): Song {
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

const noop = <div />;

describe("SongDetail", () => {
  it("renders the song title and structured fields", () => {
    render(
      <SongDetail
        song={makeSong()}
        lyrics=""
        onLyricsChange={vi.fn()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    expect(screen.getByRole("heading", { name: "Empty Road" })).toBeInTheDocument();
    expect(screen.getAllByText("The Wayfinders")[0]).toBeInTheDocument();
    expect(screen.getAllByText("96")[0]).toBeInTheDocument();
    expect(screen.getAllByText("A minor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Original")[0]).toBeInTheDocument();
  });

  it("renders the lyrics editor", () => {
    render(
      <SongDetail
        song={makeSong()}
        lyrics="Walking down that empty road"
        onLyricsChange={vi.fn()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    expect(screen.getByText(/Walking down that empty road/)).toBeInTheDocument();
  });

  it("calls onEdit when Update is chosen from the actions menu", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <SongDetail
        song={makeSong()}
        lyrics=""
        onLyricsChange={vi.fn()}
        onShare={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        attachments={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Song actions" }));
    await user.click(await screen.findByText("Update"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete after confirming Delete from the actions menu", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <SongDetail
        song={makeSong()}
        lyrics=""
        onLyricsChange={vi.fn()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        attachments={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Song actions" }));
    await user.click(await screen.findByText("Delete"));
    const confirmDialog = await screen.findByRole("alertdialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders the attachments slot", () => {
    render(
      <SongDetail
        song={makeSong()}
        lyrics=""
        onLyricsChange={vi.fn()}
        onShare={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        attachments={<div data-testid="slot">files here</div>}
      />,
    );

    expect(screen.getByTestId("slot")).toBeInTheDocument();
  });
});
