import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { ExpenseTable } from "@/components/ui/expense/expense-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventsQueryOptions } from "@/services/resources/calendar";
import {
  getExpensesQueryOptions,
  getLedgerSummaryQueryOptions,
  type Expense,
} from "@/services/resources/expense";

export interface SuspendedExpenseTableProps {
  organizationId: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function ExpenseTableContent({ organizationId, onEdit, onDelete }: SuspendedExpenseTableProps) {
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const { data: expenses } = useSuspenseQuery(getExpensesQueryOptions({ organizationId }));
  const { data: events } = useSuspenseQuery(getEventsQueryOptions({ organizationId }));

  return (
    <ExpenseTable
      expenses={expenses}
      events={events}
      participants={summary.participants}
      organizationCurrency={summary.currency}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function ExpenseTableError() {
  const { t } = useLingui();
  return <p className="m-0 text-sm text-destructive">{t`Couldn't load expenses`}</p>;
}

export function SuspendedExpenseTable(props: SuspendedExpenseTableProps) {
  return (
    <ErrorBoundary FallbackComponent={ExpenseTableError}>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ExpenseTableContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
