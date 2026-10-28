import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChordChartTextEditor } from "./chord-chart-text-editor";

async function typeChart(text: string) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<ChordChartTextEditor bars={[{ chords: ["C"] }]} onChange={onChange} />);
  const box = screen.getByRole("textbox", { name: "Chord chart as text" });
  await user.clear(box);
  if (text) {
    await user.click(box);
    await user.paste(text);
  }
  return { onChange, box };
}

describe("ChordChartTextEditor", () => {
  it("seeds the text from the bars", () => {
    render(
      <ChordChartTextEditor bars={[{ chords: ["Am"] }, { chords: ["F"] }]} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("textbox", { name: "Chord chart as text" })).toHaveValue("| Am | F |");
  });

  it("emits the parsed bars when the text is valid", async () => {
    const { onChange } = await typeChart("| Am | F |");
    expect(onChange).toHaveBeenLastCalledWith([{ chords: ["Am"] }, { chords: ["F"] }]);
  });

  it("flags an invalid chord and keeps the typed text", async () => {
    const { onChange, box } = await typeChart("| Am | H7 |");
    expect(onChange).not.toHaveBeenCalled();
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText('Bar 2: "H7" isn\'t a chord')).toBeInTheDocument();
    expect(box).toHaveValue("| Am | H7 |");
  });

  it.each([
    ["more than 8 chords in a bar", "| C | Am F C G Am F C G Am |", "Bar 2 has more than 8 chords"],
    ["no bars", "", "A section needs at least one bar"],
    ["more than 256 bars", "| C ".repeat(257) + "|", "A section can have at most 256 bars"],
  ])("flags %s without emitting", async (_, text, message) => {
    const { onChange, box } = await typeChart(text);
    expect(onChange).not.toHaveBeenCalled();
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
