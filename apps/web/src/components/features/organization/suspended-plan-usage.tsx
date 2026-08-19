import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Trans, useLingui } from "@lingui/react/macro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { UsageBar, formatBytes } from "@/ui/usage-bar";
import {
  getPlanOverviewQueryOptions,
  getStorageQuotaQueryOptions,
} from "@/services/resources/plan";

export interface SuspendedPlanUsageProps {
  organizationId: string;
  isPersonal: boolean;
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
  const { data: quota } = useSuspenseQuery(getStorageQuotaQueryOptions({ organizationId }));

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
          used={formatBytes(quota.storageBytes)}
          limit={formatBytes(quota.limitBytes)}
          ratio={quota.storageBytes / quota.limitBytes}
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
