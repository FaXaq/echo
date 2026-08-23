import { render, screen } from "@/lib/test-utils";
import { describe, expect, it, vi } from "vitest";

import { LyricsEditor } from "./lyrics-editor";

describe("LyricsEditor", () => {
  it("renders the toolbar controls", () => {
    render(<LyricsEditor markdown="" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bullet list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quote" })).toBeInTheDocument();
  });

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
});
