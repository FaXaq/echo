import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { Plus } from "lucide-react";
import type { ExpenseDialogState } from "@/components/ui/expense/expense-dialog";
import type { RepaymentDialogState } from "@/components/ui/expense/repayment-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { useDeleteExpenseMutation, useDeleteRepaymentMutation } from "@/services/resources/expense";
import { SuspendedBalances } from "./suspended-balances";
import { SuspendedExpenseDialog } from "./suspended-expense-dialog";
import { SuspendedExpenseTable } from "./suspended-expense-table";
import { SuspendedRepaymentDialog } from "./suspended-repayment-dialog";
import { SuspendedRepaymentTable } from "./suspended-repayment-table";
import { SuspendedSuggestedRepayments } from "./suspended-suggested-repayments";

export interface SuspendedExpenseLedgerProps {
  organizationId: string;
  currentUserId: string;
}

type PendingDelete = { kind: "expense" | "repayment"; id: string } | null;

export function SuspendedExpenseLedger({
  organizationId,
  currentUserId,
}: SuspendedExpenseLedgerProps) {
  const { t } = useLingui();
  const [expenseDialog, setExpenseDialog] = useState<ExpenseDialogState>(null);
  const [repaymentDialog, setRepaymentDialog] = useState<RepaymentDialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const deleteExpense = useDeleteExpenseMutation({ organizationId });
  const deleteRepayment = useDeleteRepaymentMutation({ organizationId });

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRepaymentDialog({ mode: "create" })}
        >
          {t`Record repayment`}
        </Button>
        <Button type="button" onClick={() => setExpenseDialog({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          {t`New expense`}
        </Button>
      </div>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="m-0 text-xl font-semibold">{t`Balances`}</h2>
        <SuspendedBalances organizationId={organizationId} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-xl font-semibold">{t`Suggested repayments`}</h2>
        <SuspendedSuggestedRepayments
          organizationId={organizationId}
          onRecord={(entry) =>
            setRepaymentDialog({
              mode: "create",
              suggestion: {
                fromUserId: entry.fromUserId,
                toUserId: entry.toUserId,
                amountMinor: entry.amountMinor,
              },
            })
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-xl font-semibold">{t`Expenses`}</h2>
        <SuspendedExpenseTable
          organizationId={organizationId}
          onEdit={(expense) => setExpenseDialog({ mode: "edit", expense })}
          onDelete={(expense) => setPendingDelete({ kind: "expense", id: expense.id })}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-xl font-semibold">{t`Repayments`}</h2>
        <SuspendedRepaymentTable
          organizationId={organizationId}
          onEdit={(repayment) => setRepaymentDialog({ mode: "edit", repayment })}
          onDelete={(repayment) => setPendingDelete({ kind: "repayment", id: repayment.id })}
        />
      </section>

      <SuspendedExpenseDialog
        organizationId={organizationId}
        currentUserId={currentUserId}
        state={expenseDialog}
        onClose={() => setExpenseDialog(null)}
      />

      <SuspendedRepaymentDialog
        organizationId={organizationId}
        currentUserId={currentUserId}
        state={repaymentDialog}
        onClose={() => setRepaymentDialog(null)}
      />

      <ConfirmDialog
        open={pendingDelete?.kind === "expense"}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t`Delete expense?`}
        description={t`This will permanently delete this expense and change everyone's balance. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        variant="destructive"
        onConfirm={async () => {
          if (pendingDelete?.kind !== "expense") return;
          try {
            await deleteExpense.mutateAsync({ id: pendingDelete.id });
          } catch {
            toast.add({ type: "error", title: t`Couldn't delete expense` });
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete?.kind === "repayment"}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t`Delete repayment?`}
        description={t`This will permanently delete this repayment and change the balances. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        variant="destructive"
        onConfirm={async () => {
          if (pendingDelete?.kind !== "repayment") return;
          try {
            await deleteRepayment.mutateAsync({ id: pendingDelete.id });
          } catch {
            toast.add({ type: "error", title: t`Couldn't delete repayment` });
          }
        }}
      />
    </div>
  );
}
