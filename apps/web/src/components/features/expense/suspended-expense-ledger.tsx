import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Plus } from "lucide-react";
import { BalanceList } from "@/components/ui/expense/balance-list";
import { ExpenseDialog, type ExpenseDialogState } from "@/components/ui/expense/expense-dialog";
import { ExpenseTable } from "@/components/ui/expense/expense-table";
import {
  RepaymentDialog,
  type RepaymentDialogState,
} from "@/components/ui/expense/repayment-dialog";
import { RepaymentListItem } from "@/components/ui/expense/repayment-list-item";
import { SuggestedRepaymentList } from "@/components/ui/expense/suggested-repayment-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getEventsQueryOptions } from "@/services/resources/calendar";
import {
  getExpensesQueryOptions,
  getLedgerSummaryQueryOptions,
  getRepaymentsQueryOptions,
  useCreateExpenseMutation,
  useCreateRepaymentMutation,
  useDeleteExpenseMutation,
  useDeleteRepaymentMutation,
  useUpdateExpenseMutation,
  useUpdateRepaymentMutation,
} from "@/services/resources/expense";

export interface SuspendedExpenseLedgerProps {
  organizationId: string;
  currentUserId: string;
}

type PendingDelete = { kind: "expense" | "repayment"; id: string } | null;

function ExpenseLedgerContent({ organizationId, currentUserId }: SuspendedExpenseLedgerProps) {
  const { t } = useLingui();
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const { data: expenses } = useSuspenseQuery(getExpensesQueryOptions({ organizationId }));
  const { data: repayments } = useSuspenseQuery(getRepaymentsQueryOptions({ organizationId }));
  const { data: events } = useSuspenseQuery(getEventsQueryOptions({ organizationId }));

  const [expenseDialog, setExpenseDialog] = useState<ExpenseDialogState>(null);
  const [repaymentDialog, setRepaymentDialog] = useState<RepaymentDialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const createExpense = useCreateExpenseMutation({ organizationId });
  const updateExpense = useUpdateExpenseMutation({ organizationId });
  const deleteExpense = useDeleteExpenseMutation({ organizationId });
  const createRepayment = useCreateRepaymentMutation({ organizationId });
  const updateRepayment = useUpdateRepaymentMutation({ organizationId });
  const deleteRepayment = useDeleteRepaymentMutation({ organizationId });

  const nameOf = (userId: string) =>
    summary.participants.find((participant) => participant.userId === userId)?.name ?? userId;

  const balanceEntries = summary.balances.map((balance) => ({
    userId: balance.userId,
    name: nameOf(balance.userId),
    isMember:
      summary.participants.find((participant) => participant.userId === balance.userId)?.isMember ??
      false,
    amountMinor: balance.amountMinor,
  }));
  const suggestionEntries = summary.suggestedRepayments.map((suggestion) => ({
    ...suggestion,
    fromName: nameOf(suggestion.fromUserId),
    toName: nameOf(suggestion.toUserId),
  }));

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
        <BalanceList entries={balanceEntries} currency={summary.currency} />
      </section>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="m-0 text-xl font-semibold">{t`Suggested repayments`}</h2>
        <SuggestedRepaymentList
          entries={suggestionEntries}
          currency={summary.currency}
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
        <ExpenseTable
          expenses={expenses}
          events={events}
          participants={summary.participants}
          organizationCurrency={summary.currency}
          onEdit={(expense) => setExpenseDialog({ mode: "edit", expense })}
          onDelete={(expense) => setPendingDelete({ kind: "expense", id: expense.id })}
        />
      </section>

      {repayments.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-xl font-semibold">{t`Repayments`}</h2>
          {repayments.map((repayment) => (
            <RepaymentListItem
              key={repayment.id}
              repayment={repayment}
              fromName={nameOf(repayment.fromUserId)}
              toName={nameOf(repayment.toUserId)}
              currency={summary.currency}
              onEdit={() => setRepaymentDialog({ mode: "edit", repayment })}
              onDelete={() => setPendingDelete({ kind: "repayment", id: repayment.id })}
            />
          ))}
        </section>
      )}

      <ExpenseDialog
        state={expenseDialog}
        participants={summary.participants}
        events={events.map((event) => ({ id: event.id, title: event.title }))}
        organizationCurrency={summary.currency}
        currentUserId={currentUserId}
        onOpenChange={(open) => !open && setExpenseDialog(null)}
        onSubmit={async (submission) => {
          try {
            if (expenseDialog?.mode === "edit") {
              await updateExpense.mutateAsync({ id: expenseDialog.expense.id, ...submission });
            } else {
              await createExpense.mutateAsync(submission);
            }
            setExpenseDialog(null);
          } catch {
            toast.add({ type: "error", title: t`Couldn't save expense` });
          }
        }}
      />

      <RepaymentDialog
        state={repaymentDialog}
        participants={summary.participants}
        organizationCurrency={summary.currency}
        currentUserId={currentUserId}
        onOpenChange={(open) => !open && setRepaymentDialog(null)}
        onSubmit={async (submission) => {
          try {
            if (repaymentDialog?.mode === "edit") {
              await updateRepayment.mutateAsync({
                id: repaymentDialog.repayment.id,
                ...submission,
              });
            } else {
              await createRepayment.mutateAsync(submission);
            }
            setRepaymentDialog(null);
          } catch {
            toast.add({ type: "error", title: t`Couldn't save repayment` });
          }
        }}
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

function ExpenseLedgerError() {
  const { t } = useLingui();
  return <p className="p-6 text-sm text-destructive">{t`Couldn't load expenses`}</p>;
}

function ExpenseLedgerLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-9 w-64 self-end" />
      <Skeleton className="h-24 max-w-xl" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function SuspendedExpenseLedger(props: SuspendedExpenseLedgerProps) {
  return (
    <ErrorBoundary FallbackComponent={ExpenseLedgerError}>
      <Suspense fallback={<ExpenseLedgerLoader />}>
        <ExpenseLedgerContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
