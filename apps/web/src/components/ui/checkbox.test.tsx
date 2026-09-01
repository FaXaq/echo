import { render, screen } from "@/lib/test-utils";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders a minus glyph, not a checkmark, when indeterminate", () => {
    render(<Checkbox checked={false} indeterminate aria-label="Select all" />);

    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-checked", "mixed");
    expect(box.querySelector("svg.lucide-minus")).toBeTruthy();
    expect(box.querySelector("svg.lucide-check")).toBeFalsy();
  });
});
