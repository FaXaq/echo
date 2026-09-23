import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLingui } from "@lingui/react/macro";
import { Skeleton } from "@/components/ui/skeleton";
import type { OutreachCard } from "@/services/resources/outreach";
import { OutreachBoard } from "./outreach-board";

function OutreachBoardError() {
  const { t } = useLingui();
  return <p className="text-sm text-destructive">{t`Couldn't load the Outreach board`}</p>;
}

function OutreachBoardSkeleton() {
  return (
    <div className="flex flex-1 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-full w-72 shrink-0 rounded-xl" />
      ))}
    </div>
  );
}

export function SuspendedOutreachBoard({
  organizationId,
  onCardClick,
}: {
  organizationId: string;
  onCardClick: (card: OutreachCard) => void;
}) {
  return (
    <ErrorBoundary FallbackComponent={OutreachBoardError}>
      <Suspense fallback={<OutreachBoardSkeleton />}>
        <OutreachBoard organizationId={organizationId} onCardClick={onCardClick} />
      </Suspense>
    </ErrorBoundary>
  );
}
