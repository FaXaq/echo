import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Skeleton } from "@/ui/skeleton";
import { UsageBar, formatBytes } from "@/ui/usage-bar";
import { getStorageQuotaQueryOptions } from "@/services/resources/plan";

function DriveQuotaBarContent({ organizationId }: { organizationId: string }) {
  const { t } = useLingui();
  const { data } = useSuspenseQuery(getStorageQuotaQueryOptions({ organizationId }));

  return (
    <UsageBar
      label={t`Storage`}
      used={formatBytes(data.storageBytes)}
      limit={formatBytes(data.limitBytes)}
      ratio={data.storageBytes / data.limitBytes}
    />
  );
}

function DriveQuotaBarError() {
  return null;
}

export function SuspendedDriveQuotaBar({ organizationId }: { organizationId: string }) {
  return (
    <ErrorBoundary FallbackComponent={DriveQuotaBarError}>
      <Suspense fallback={<Skeleton className="h-8 w-56" />}>
        <DriveQuotaBarContent organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
