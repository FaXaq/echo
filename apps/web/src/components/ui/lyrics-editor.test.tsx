import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LyricsEditor } from "./lyrics-editor";

// jsdom has no Range layout methods, which ProseMirror calls when the editor regains focus.
Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();

describe("LyricsEditor", () => {
  it("renders the initial markdown content", async () => {
    render(<LyricsEditor markdown="**Hold on**, hold on to me" onChange={vi.fn()} />);

    // "**Hold on**" renders as a nested <strong>, so the text is split across
    // elements; getByText only matches an element's own direct text nodes by
    // default, hence the textContent-based matcher instead of a plain regex.
    // The children check keeps the match to the innermost node (the <p>),
    // since every ancestor wrapper also has the same full textContent.
    expect(
      await screen.findByText((_, element) => {
        const hasFullText = element?.textContent === "Hold on, hold on to me";
        const childrenHaveFullText = Array.from(element?.children ?? []).some(
          (child) => child.textContent === "Hold on, hold on to me",
        );
        return hasFullText && !childrenHaveFullText;
      }),
    ).toBeInTheDocument();
  });

  it("shows full-screen edits in the inline editor once closed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<LyricsEditor markdown="First draft" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(await screen.findByRole("heading", { name: "Lyrics" })).toBeInTheDocument();

    rerender(<LyricsEditor markdown="Edited in full screen" onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(await screen.findByText("Edited in full screen")).toBeInTheDocument();
  });
});
