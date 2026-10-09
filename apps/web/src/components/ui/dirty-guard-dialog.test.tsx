import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DialogContent, DialogTitle } from "./dialog";
import { DirtyGuardDialog } from "./dirty-guard-dialog";

function renderDialog(isDirty: boolean) {
  const onOpenChange = vi.fn();
  render(
    <DirtyGuardDialog open isDirty={isDirty} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit song</DialogTitle>
      </DialogContent>
    </DirtyGuardDialog>,
  );
  return onOpenChange;
}

describe("DirtyGuardDialog", () => {
  it("closes directly when the form is pristine", async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog(false);

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("asks before discarding a dirty form", async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog(true);

    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(await screen.findByRole("button", { name: "Discard" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
