import { render, screen } from "@/lib/test-utils";
import { describe, expect, it } from "vitest";

import { ChordGrid } from "./chord-grid";

describe("ChordGrid", () => {
  it("labels each bar with its chords, % for repeats and N.C. for empty bars", () => {
    render(
      <ChordGrid
        bars={[{ chords: ["Am"] }, { chords: ["Am"] }, { chords: ["C", "G"] }, { chords: [] }]}
      />,
    );

    expect(screen.getByLabelText("Bar 1: Am")).toHaveTextContent("Am");
    expect(screen.getByLabelText("Bar 2: %")).toHaveTextContent("%");
    expect(screen.getByLabelText("Bar 3: C / G")).toHaveTextContent("C / G");
    expect(screen.getByLabelText("Bar 4: N.C.")).toHaveClass("justify-center");
  });
});
