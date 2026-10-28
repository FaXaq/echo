import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SongSection } from "@echo/modules/song/domain";

import { SectionPanel } from "./section-panel";

const section: SongSection = {
  id: "s1",
  kind: "verse",
  name: "Verse 1",
  repeat: 1,
  time: { beats: 4, beatType: 4 },
  bars: [{ chords: ["Am"] }],
  notes: "",
};

describe("SectionPanel", () => {
  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SectionPanel section={section} onChange={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete section" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete section" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("drops a bar time equal to the section time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SectionPanel section={section} onChange={onChange} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: "Text" }));
    const box = screen.getByRole("textbox", { name: "Chord chart as text" });
    await user.clear(box);
    await user.click(box);
    await user.paste("| (4/4) Am | (3/4) G |");

    expect(onChange).toHaveBeenLastCalledWith({
      ...section,
      bars: [{ chords: ["Am"] }, { chords: ["G"], time: { beats: 3, beatType: 4 } }],
    });
  });
});
