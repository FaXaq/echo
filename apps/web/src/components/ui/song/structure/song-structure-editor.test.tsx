import { render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SongSection } from "@echo/modules/song/domain";

import { SongStructureEditor } from "./song-structure-editor";

const defaultTime = { beats: 3, beatType: 4 } satisfies SongSection["time"];

function makeSection(overrides: Partial<SongSection> = {}): SongSection {
  return {
    id: "s1",
    kind: "verse",
    name: "Verse 1",
    repeat: 1,
    time: { beats: 4, beatType: 4 },
    bars: [{ chords: ["Am"] }, { chords: ["F"] }],
    notes: "",
    ...overrides,
  };
}

describe("SongStructureEditor", () => {
  it("shows an empty state and inserts a chosen section kind", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SongStructureEditor
        structure={{ sections: [] }}
        defaultTime={defaultTime}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("No sections yet")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add section" })[0]);
    await user.click(screen.getByRole("button", { name: "Chorus" }));

    expect(onChange).toHaveBeenCalledWith({
      sections: [
        {
          id: expect.any(String),
          kind: "chorus",
          name: "Chorus",
          repeat: 1,
          time: defaultTime,
          bars: [{ chords: [] }, { chords: [] }, { chords: [] }, { chords: [] }],
          notes: "",
        },
      ],
    });
  });

  it("swaps the chord grid for the text editor", async () => {
    const user = userEvent.setup();
    render(
      <SongStructureEditor
        structure={{ sections: [makeSection()] }}
        defaultTime={defaultTime}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Bar 1: Am")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Text" }));
    expect(screen.getByRole("textbox", { name: "Chord chart as text" })).toHaveValue("| Am | F |");
    await waitFor(() => expect(screen.queryByLabelText("Bar 1: Am")).not.toBeInTheDocument());
  });

  it("increments the repeat of the selected section up to 16", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SongStructureEditor
        structure={{ sections: [makeSection({ repeat: 2 })] }}
        defaultTime={defaultTime}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "More repeats" }));
    expect(onChange).toHaveBeenLastCalledWith({ sections: [makeSection({ repeat: 3 })] });

    onChange.mockClear();
    rerender(
      <SongStructureEditor
        structure={{ sections: [makeSection({ repeat: 16 })] }}
        defaultTime={defaultTime}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "More repeats" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
