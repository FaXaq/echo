import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import {
  SuggestedRepaymentList,
  type SuggestedRepaymentEntry,
} from "@/components/ui/expense/suggested-repayment-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getLedgerSummaryQueryOptions } from "@/services/resources/expense";

export interface SuspendedSuggestedRepaymentsProps {
  organizationId: string;
  onRecord: (entry: SuggestedRepaymentEntry) => void;
}

function SuggestedRepaymentsContent({
  organizationId,
  onRecord,
}: SuspendedSuggestedRepaymentsProps) {
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const nameOf = (userId: string) =>
    summary.participants.find((participant) => participant.userId === userId)?.name ?? userId;

  return (
    <SuggestedRepaymentList
      entries={summary.suggestedRepayments.map((suggestion) => ({
        ...suggestion,
        fromName: nameOf(suggestion.fromUserId),
        toName: nameOf(suggestion.toUserId),
      }))}
      currency={summary.currency}
      onRecord={onRecord}
    />
  );
}

function SuggestedRepaymentsError() {
  const { t } = useLingui();
  return <p className="m-0 text-sm text-destructive">{t`Couldn't load suggested repayments`}</p>;
}

export function SuspendedSuggestedRepayments(props: SuspendedSuggestedRepaymentsProps) {
  return (
    <ErrorBoundary FallbackComponent={SuggestedRepaymentsError}>
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <SuggestedRepaymentsContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
