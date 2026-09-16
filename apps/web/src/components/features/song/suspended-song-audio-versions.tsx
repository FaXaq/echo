import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { History, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongAudioVersionsQueryOptions, type SongAudioVersion } from "@/services/resources/song";

function VersionRow({ label, versions }: { label: string; versions: SongAudioVersion[] }) {
  const { t } = useLingui();
  const [current, ...history] = versions;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Music className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-medium">{label}</span>
      {current ? (
        <>
          <Badge variant="secondary">{`v${current.version}`}</Badge>
          <span className="truncate text-muted-foreground">{current.filename}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{t`None yet`}</span>
      )}
      {history.length > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="ms-auto"
                aria-label={t`${label} history`}
              />
            }
          >
            <History />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>{t`${label} history`}</PopoverTitle>
            </PopoverHeader>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {versions.map((version) => (
                <li key={version.id} className="flex flex-col text-xs">
                  <span className="truncate font-medium">{`v${version.version} — ${version.filename}`}</span>
                  <span className="text-muted-foreground">
                    {version.uploadedByName} · {new Date(version.linkedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function SongAudioVersionsContent({ songId, organizationId }: SuspendedSongAudioVersionsProps) {
  const { t } = useLingui();
  const { data } = useSuspenseQuery(getSongAudioVersionsQueryOptions({ songId, organizationId }));

  if (data.demo.length === 0 && data.final.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
      <VersionRow label={t`Demo`} versions={data.demo} />
      <VersionRow label={t`Final`} versions={data.final} />
    </div>
  );
}

export interface SuspendedSongAudioVersionsProps {
  songId: string;
  organizationId: string;
}

export function SuspendedSongAudioVersions(props: SuspendedSongAudioVersionsProps) {
  return (
    <ErrorBoundary fallbackRender={() => null}>
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <SongAudioVersionsContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
