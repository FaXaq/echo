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
    timeSignature: null,
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

  async function submitTimeSignature(value: string) {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SongDialog state={{ mode: "create" }} onOpenChange={vi.fn()} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "New Song");
    if (value) await user.type(screen.getByLabelText("Time signature"), value);
    await user.click(screen.getByRole("button", { name: "Create song" }));
    return onSubmit;
  }

  it("submits a valid time signature", async () => {
    const onSubmit = await submitTimeSignature("3/4");
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ timeSignature: "3/4" }));
  });

  it("rejects an invalid time signature", async () => {
    const onSubmit = await submitTimeSignature("4/3");
    expect(await screen.findByText("Time signature must look like 4/4")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits an undefined time signature when empty", async () => {
    const onSubmit = await submitTimeSignature("");
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ timeSignature: undefined }));
    expect(onSubmit.mock.calls[0][0]).toHaveProperty("timeSignature", undefined);
  });
});
