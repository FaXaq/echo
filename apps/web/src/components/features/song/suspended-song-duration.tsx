import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getSongDefaultAudioQueryOptions } from "@/services/resources/song";
import { formatDuration } from "@/lib/file";
import { Skeleton } from "@/ui/skeleton";

function SongDurationContent({
  songId,
  organizationId,
}: {
  songId: string;
  organizationId: string;
}) {
  const { data: file } = useSuspenseQuery(
    getSongDefaultAudioQueryOptions({ songId, organizationId }),
  );

  if (!file || file.durationSeconds == null) return null;

  return <span>{formatDuration(file.durationSeconds)}</span>;
}

export function SuspendedSongDuration(props: { songId: string; organizationId: string }) {
  return (
    <ErrorBoundary fallbackRender={() => null}>
      <Suspense fallback={<Skeleton className="h-4 w-8" />}>
        <SongDurationContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
