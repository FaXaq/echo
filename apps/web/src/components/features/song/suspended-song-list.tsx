import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Music, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SongDialog, type SongDialogState } from "@/components/ui/song/song-dialog";
import { getSongsQueryOptions, useCreateSongMutation, type Song } from "@/services/resources/song";

export interface SuspendedSongListProps {
  organizationId: string;
  projectSlug: string;
  onSongCreated: (song: Song) => void;
}

function SongListContent({ organizationId, projectSlug, onSongCreated }: SuspendedSongListProps) {
  const { t } = useLingui();
  const { data: songs } = useSuspenseQuery(getSongsQueryOptions({ organizationId }));
  const [dialogState, setDialogState] = useState<SongDialogState>(null);

  const createSongMutation = useCreateSongMutation({
    onSuccess: (song) => {
      setDialogState(null);
      onSongCreated(song);
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t`Songs`}</h1>
          <p className="text-muted-foreground">{t`Your project's songs and lyrics`}</p>
        </div>
        <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
          <Plus data-icon="inline-start" />
          {t`New song`}
        </Button>
      </div>

      {songs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t`No songs yet.`}</p>
      ) : (
        <ul className="flex flex-col gap-2 m-0 p-0">
          {songs.map((song) => (
            <li key={song.id} className="m-0 p-0 list-none">
              <Link
                to="/projects/$projectSlug/songs/$songId"
                params={{ projectSlug, songId: song.id }}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 hover:bg-muted/50"
              >
                <Music className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{song.title}</span>
                {song.artist && (
                  <span className="text-xs text-muted-foreground">{song.artist}</span>
                )}
                {song.type && (
                  <Badge variant="secondary">
                    {song.type === "original" ? t`Original` : t`Cover`}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SongDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={async (values) => {
          await createSongMutation.mutateAsync({ organizationId, ...values });
        }}
      />
    </div>
  );
}

function SongListError() {
  const { t } = useLingui();
  return <p className="p-6 text-sm text-destructive">{t`Couldn't load songs`}</p>;
}

function SongListLoader() {
  return (
    <div className="p-6 flex flex-col gap-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function SuspendedSongList({
  organizationId,
  projectSlug,
  onSongCreated,
}: SuspendedSongListProps) {
  return (
    <ErrorBoundary FallbackComponent={SongListError}>
      <Suspense fallback={<SongListLoader />}>
        <SongListContent
          organizationId={organizationId}
          projectSlug={projectSlug}
          onSongCreated={onSongCreated}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
