import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/lib/test-utils";
import { RepaymentDialog, type RepaymentDialogState } from "./repayment-dialog";

const participants = [
  { userId: "marie", name: "Marie", isMember: true },
  { userId: "paul", name: "Paul", isMember: false },
];

function renderDialog(state: RepaymentDialogState, onSubmit = vi.fn()) {
  render(
    <RepaymentDialog
      state={state}
      participants={participants}
      organizationCurrency="EUR"
      currentUserId="marie"
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("RepaymentDialog", () => {
  it("offers a former member as a person to repay", async () => {
    const user = userEvent.setup();
    renderDialog({ mode: "create" });

    await user.click(screen.getByLabelText("To"));

    expect(await screen.findByRole("option", { name: "Paul" })).toBeInTheDocument();
  });

  it("submits minor units for a suggested repayment from a former member", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog({
      mode: "create",
      suggestion: { fromUserId: "paul", toUserId: "marie", amountMinor: 3000 },
    });

    await user.click(screen.getByRole("button", { name: "Create repayment" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      fromUserId: "paul",
      toUserId: "marie",
      amountMinor: 3000,
    });
  });

  it("shows an error and does not submit when from and to are the same person", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog({
      mode: "create",
      suggestion: { fromUserId: "marie", toUserId: "marie", amountMinor: 1000 },
    });

    await user.click(screen.getByRole("button", { name: "Create repayment" }));

    expect(await screen.findByText("Choose two different people")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
