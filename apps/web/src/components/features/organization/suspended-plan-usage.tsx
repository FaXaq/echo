import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trans, useLingui } from "@lingui/react/macro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/ui/progress";
import { Skeleton } from "@/ui/skeleton";
import { getPlanOverviewQueryOptions } from "@/services/resources/plan";

export interface SuspendedPlanUsageProps {
  organizationId: string;
  isPersonal: boolean;
}

function formatBytes(bytes: number) {
  const gigabytes = bytes / 1_000_000_000;
  if (gigabytes >= 1) return `${gigabytes.toFixed(1)} GB`;
  return `${Math.round(bytes / 1_000_000)} MB`;
}

function UsageBar({
  label,
  used,
  limit,
  ratio,
}: {
  label: string;
  used: string;
  limit: string;
  ratio: number;
}) {
  const percent = Math.min(100, Math.round(ratio * 100));
  return (
    <Progress value={percent}>
      <ProgressLabel>{label}</ProgressLabel>
      <ProgressValue>{() => `${used} / ${limit}`}</ProgressValue>
    </Progress>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground ms-auto tabular-nums">{value}</span>
    </div>
  );
}

function PlanUsageContent({ organizationId, isPersonal }: SuspendedPlanUsageProps) {
  const { t } = useLingui();
  const { data } = useSuspenseQuery(getPlanOverviewQueryOptions({ organizationId }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Plan & usage</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Your current plan and what you have used of it.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <UsageBar
          label={t`Storage`}
          used={formatBytes(data.usage.storageBytes)}
          limit={formatBytes(data.limits.storageBytes)}
          ratio={data.usage.storageBytes / data.limits.storageBytes}
        />
        {!isPersonal && (
          <UsageBar
            label={t`Members`}
            used={String(data.usage.memberSeats)}
            limit={String(data.limits.memberSeats)}
            ratio={data.usage.memberSeats / data.limits.memberSeats}
          />
        )}
        <StatRow label={t`Maximum file size`} value={formatBytes(data.limits.maxFileSizeBytes)} />
      </CardContent>
    </Card>
  );
}

function PlanUsageError() {
  return (
    <p className="text-destructive text-sm">
      <Trans>Could not load plan usage</Trans>
    </p>
  );
}

export function SuspendedPlanUsage(props: SuspendedPlanUsageProps) {
  return (
    <ErrorBoundary FallbackComponent={PlanUsageError}>
      <Suspense fallback={<Skeleton className="h-48 max-w-xl" />}>
        <PlanUsageContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
