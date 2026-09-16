import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SongDialog, type SongDialogState } from "@/components/ui/song/song-dialog";
import { SongListItem } from "@/components/ui/song/song-list-item";
import { getSongsQueryOptions, useCreateSongMutation, type Song } from "@/services/resources/song";

export interface SuspendedSongListProps {
  organizationId: string;
  projectSlug: string;
  onSongCreated: (song: Song) => void;
}

function SongListContent({ organizationId, projectSlug, onSongCreated }: SuspendedSongListProps) {
  const { t } = useLingui();
  const posthog = usePostHog();
  const { data: songs } = useSuspenseQuery(getSongsQueryOptions({ organizationId }));
  const [dialogState, setDialogState] = useState<SongDialogState>(null);

  const createSongMutation = useCreateSongMutation({
    onSuccess: (song) => {
      posthog.capture("song_created");
      setDialogState(null);
      onSongCreated(song);
    },
  });

  return (
    <div className="p-6 flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          onClick={() => setDialogState({ mode: "create" })}
          size="icon"
          className="md:hidden"
        >
          <Plus />
        </Button>
        <Button
          type="button"
          onClick={() => setDialogState({ mode: "create" })}
          size="sm"
          className="hidden md:inline-flex"
        >
          <Plus data-icon="inline-start" />
          {t`New song`}
        </Button>
      </div>

      {songs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t`No songs yet.`}</p>
      ) : (
        <ul className="flex flex-col m-0 p-0">
          {songs.map((song) => (
            <li key={song.id} className="m-0 p-0 list-none">
              <SongListItem song={song} projectSlug={projectSlug} />
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
