import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { BalanceList } from "@/components/ui/expense/balance-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getLedgerSummaryQueryOptions } from "@/services/resources/expense";

export interface SuspendedBalancesProps {
  organizationId: string;
}

function BalancesContent({ organizationId }: SuspendedBalancesProps) {
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));

  const entries = summary.balances.map((balance) => {
    const participant = summary.participants.find((p) => p.userId === balance.userId);
    return {
      userId: balance.userId,
      name: participant?.name ?? balance.userId,
      isMember: participant?.isMember ?? false,
      amountMinor: balance.amountMinor,
    };
  });

  return <BalanceList entries={entries} currency={summary.currency} />;
}

function BalancesError() {
  const { t } = useLingui();
  return <p className="m-0 text-sm text-destructive">{t`Couldn't load balances`}</p>;
}

export function SuspendedBalances(props: SuspendedBalancesProps) {
  return (
    <ErrorBoundary FallbackComponent={BalancesError}>
      <Suspense fallback={<Skeleton className="h-24 w-full max-w-xl" />}>
        <BalancesContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
