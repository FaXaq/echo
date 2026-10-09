import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { LedgerStats } from "@/components/ui/expense/ledger-stats";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getExpensesQueryOptions,
  getLedgerSummaryQueryOptions,
} from "@/services/resources/expense";

export interface SuspendedLedgerStatsProps {
  organizationId: string;
  currentUserId: string;
}

function LedgerStatsContent({ organizationId, currentUserId }: SuspendedLedgerStatsProps) {
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const { data: expenses } = useSuspenseQuery(getExpensesQueryOptions({ organizationId }));
  const sum = (amounts: number[]) => amounts.reduce((total, amount) => total + amount, 0);

  return (
    <LedgerStats
      currency={summary.currency}
      totalSpentMinor={sum(expenses.map((expense) => expense.convertedAmountMinor))}
      expenseCount={expenses.length}
      yourBalanceMinor={
        summary.balances.find((balance) => balance.userId === currentUserId)?.amountMinor ?? 0
      }
      toSettleMinor={sum(summary.suggestedRepayments.map((entry) => entry.amountMinor))}
      settleCount={summary.suggestedRepayments.length}
    />
  );
}

function LedgerStatsError() {
  const { t } = useLingui();
  return <p className="m-0 text-sm text-destructive">{t`Couldn't load the summary`}</p>;
}

export function SuspendedLedgerStats(props: SuspendedLedgerStatsProps) {
  return (
    <ErrorBoundary FallbackComponent={LedgerStatsError}>
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <LedgerStatsContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
