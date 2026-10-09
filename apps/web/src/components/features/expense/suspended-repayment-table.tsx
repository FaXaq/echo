import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { RepaymentTable } from "@/components/ui/expense/repayment-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLedgerSummaryQueryOptions,
  getRepaymentsQueryOptions,
  type Repayment,
} from "@/services/resources/expense";

export interface SuspendedRepaymentTableProps {
  organizationId: string;
  onEdit: (repayment: Repayment) => void;
  onDelete: (repayment: Repayment) => void;
}

function RepaymentTableContent({ organizationId, onEdit, onDelete }: SuspendedRepaymentTableProps) {
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const { data: repayments } = useSuspenseQuery(getRepaymentsQueryOptions({ organizationId }));

  return (
    <RepaymentTable
      repayments={repayments}
      participants={summary.participants}
      currency={summary.currency}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function RepaymentTableError() {
  const { t } = useLingui();
  return <p className="m-0 text-sm text-destructive">{t`Couldn't load repayments`}</p>;
}

export function SuspendedRepaymentTable(props: SuspendedRepaymentTableProps) {
  return (
    <ErrorBoundary FallbackComponent={RepaymentTableError}>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <RepaymentTableContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
