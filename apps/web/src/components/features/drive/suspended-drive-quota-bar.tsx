import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { Skeleton } from "@/ui/skeleton";
import { ProgressIndicator, ProgressTrack, ProgressValue } from "@/ui/progress";
import { formatBytes } from "@/ui/usage-bar";
import { getStorageQuotaQueryOptions } from "@/services/resources/plan";

function DriveQuotaBarContent({ organizationId }: { organizationId: string }) {
  const { data } = useSuspenseQuery(getStorageQuotaQueryOptions({ organizationId }));
  const percent = Math.min(100, Math.round((data.storageBytes / data.limitBytes) * 100));

  return (
    <ProgressPrimitive.Root value={percent} className="flex items-center gap-2">
      <ProgressValue className="shrink-0 ms-0 text-xs">
        {() => `${formatBytes(data.storageBytes)} / ${formatBytes(data.limitBytes)}`}
      </ProgressValue>
      <ProgressTrack className="w-32">
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function DriveQuotaBarError() {
  return null;
}

export function SuspendedDriveQuotaBar({ organizationId }: { organizationId: string }) {
  return (
    <ErrorBoundary FallbackComponent={DriveQuotaBarError}>
      <Suspense fallback={<Skeleton className="h-4 w-56" />}>
        <DriveQuotaBarContent organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
