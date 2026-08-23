import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SongDialog } from "./song-dialog";
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

describe("SongDialog", () => {
  it("shows an empty form titled New song when creating", () => {
    render(<SongDialog state={{ mode: "create" }} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "New song" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("pre-fills the form when editing", () => {
    render(
      <SongDialog
        state={{ mode: "edit", song: makeSong() }}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit song" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Empty Road");
    expect(screen.getByLabelText("Artist")).toHaveValue("The Wayfinders");
    expect(screen.getByLabelText("BPM")).toHaveValue("96");
  });

  it("submits the parsed form values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongDialog state={{ mode: "create" }} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Title"), "New Song");
    await user.type(screen.getByLabelText("BPM"), "120");
    await user.click(screen.getByRole("button", { name: "Create song" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "New Song",
      artist: undefined,
      bpm: 120,
      key: undefined,
      type: "original",
    });
  });

  it("rejects a non-numeric BPM", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongDialog state={{ mode: "create" }} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Title"), "New Song");
    await user.type(screen.getByLabelText("BPM"), "fast");
    await user.click(screen.getByRole("button", { name: "Create song" }));

    expect(await screen.findByText("BPM must be a whole number")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
