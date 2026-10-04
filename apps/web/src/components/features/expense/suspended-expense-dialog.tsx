import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { ExpenseDialog, type ExpenseDialogState } from "@/components/ui/expense/expense-dialog";
import { toast } from "@/components/ui/toast";
import { getEventsQueryOptions } from "@/services/resources/calendar";
import {
  getLedgerSummaryQueryOptions,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "@/services/resources/expense";

export interface SuspendedExpenseDialogProps {
  organizationId: string;
  currentUserId: string;
  state: ExpenseDialogState;
  onClose: () => void;
}

function ExpenseDialogContent({
  organizationId,
  currentUserId,
  state,
  onClose,
}: SuspendedExpenseDialogProps) {
  const { t } = useLingui();
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const { data: events } = useSuspenseQuery(getEventsQueryOptions({ organizationId }));
  const createExpense = useCreateExpenseMutation({ organizationId });
  const updateExpense = useUpdateExpenseMutation({ organizationId });

  return (
    <ExpenseDialog
      state={state}
      participants={summary.participants}
      events={events.map((event) => ({ id: event.id, title: event.title }))}
      organizationCurrency={summary.currency}
      currentUserId={currentUserId}
      onOpenChange={(open) => !open && onClose()}
      onSubmit={async (submission) => {
        try {
          if (state?.mode === "edit") {
            await updateExpense.mutateAsync({ id: state.expense.id, ...submission });
          } else {
            await createExpense.mutateAsync(submission);
          }
          onClose();
        } catch {
          toast.add({ type: "error", title: t`Couldn't save expense` });
        }
      }}
    />
  );
}

export function SuspendedExpenseDialog(props: SuspendedExpenseDialogProps) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <ExpenseDialogContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
