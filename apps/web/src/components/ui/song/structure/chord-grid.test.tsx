import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChordGrid } from "./chord-grid";

describe("ChordGrid", () => {
  it("labels each bar with its chords, % for repeats and N.C. for empty bars", () => {
    render(
      <ChordGrid
        bars={[{ chords: ["Am"] }, { chords: ["Am"] }, { chords: ["C", "G"] }, { chords: [] }]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Bar 1: Am")).toHaveTextContent("Am");
    expect(screen.getByLabelText("Bar 2: %")).toHaveTextContent("%");
    expect(screen.getByLabelText("Bar 3: C / G")).toHaveTextContent("C / G");
    expect(screen.getByLabelText("Bar 4: N.C.")).toHaveTextContent("N.C.");
  });

  it("edits a bar on click and commits on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChordGrid bars={[{ chords: ["Am"] }, { chords: ["F"] }]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Bar 2: F"));
    const input = screen.getByLabelText("Chords for bar 2");
    expect(input).toHaveValue("F");
    await user.clear(input);
    await user.type(input, "%{Enter}");

    expect(onChange).toHaveBeenCalledWith([{ chords: ["Am"] }, { chords: ["Am"] }]);
  });

  it("appends a bar repeating the last one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChordGrid bars={[{ chords: ["C", "G"] }]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add a bar" }));

    expect(onChange).toHaveBeenCalledWith([{ chords: ["C", "G"] }, { chords: ["C", "G"] }]);
  });

  it("removes a bar, but never the last one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <ChordGrid bars={[{ chords: ["Am"] }, { chords: ["F"] }]} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Remove bar 1" }));
    expect(onChange).toHaveBeenCalledWith([{ chords: ["F"] }]);

    rerender(<ChordGrid bars={[{ chords: ["F"] }]} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: "Remove bar 1" })).not.toBeInTheDocument();
  });

  it("keeps the bar unchanged on Escape or an invalid chord", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChordGrid bars={[{ chords: ["Am"] }]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Bar 1: Am"));
    await user.clear(screen.getByLabelText("Chords for bar 1"));
    await user.type(screen.getByLabelText("Chords for bar 1"), "zz");
    expect(screen.getByLabelText("Chords for bar 1")).toHaveAttribute("aria-invalid", "true");
    await user.keyboard("{Enter}");
    await user.click(screen.getByLabelText("Bar 1: Am"));
    await user.keyboard("{Escape}");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Bar 1: Am")).toBeInTheDocument();
  });
});
