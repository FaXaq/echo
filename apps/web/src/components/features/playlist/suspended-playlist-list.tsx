import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ListMusic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistDialog } from "@/components/ui/playlist/playlist-dialog";
import {
  getPlaylistsQueryOptions,
  useCreatePlaylistMutation,
  type Playlist,
} from "@/services/resources/playlist";

export interface SuspendedPlaylistListProps {
  organizationId: string;
  projectSlug: string;
  onPlaylistCreated: (playlist: Playlist) => void;
}

function PlaylistListContent({
  organizationId,
  projectSlug,
  onPlaylistCreated,
}: SuspendedPlaylistListProps) {
  const { t } = useLingui();
  const posthog = usePostHog();
  const { data: playlists } = useSuspenseQuery(getPlaylistsQueryOptions({ organizationId }));
  const [dialogOpen, setDialogOpen] = useState(false);

  const createPlaylistMutation = useCreatePlaylistMutation({
    onSuccess: (playlist) => {
      posthog.capture("playlist_created");
      setDialogOpen(false);
      onPlaylistCreated(playlist);
    },
  });

  return (
    <div className="p-6 flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => setDialogOpen(true)} size="icon" className="md:hidden">
          <Plus />
        </Button>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="hidden md:inline-flex"
        >
          <Plus data-icon="inline-start" />
          {t`New playlist`}
        </Button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t`No playlists yet.`}</p>
      ) : (
        <ul className="flex flex-col gap-2 m-0 p-0">
          {playlists.map((playlist) => (
            <li key={playlist.id} className="m-0 p-0 list-none">
              <Link
                to="/projects/$projectSlug/playlists/$playlistId"
                params={{ projectSlug, playlistId: playlist.id }}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 hover:bg-muted/50"
              >
                <ListMusic className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{playlist.title}</span>
                {playlist.description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {playlist.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <PlaylistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (values) => {
          await createPlaylistMutation.mutateAsync({ organizationId, ...values });
        }}
      />
    </div>
  );
}

function PlaylistListError() {
  const { t } = useLingui();
  return <p className="p-6 text-sm text-destructive">{t`Couldn't load playlists`}</p>;
}

function PlaylistListLoader() {
  return (
    <div className="p-6 flex flex-col gap-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function SuspendedPlaylistList({
  organizationId,
  projectSlug,
  onPlaylistCreated,
}: SuspendedPlaylistListProps) {
  return (
    <ErrorBoundary FallbackComponent={PlaylistListError}>
      <Suspense fallback={<PlaylistListLoader />}>
        <PlaylistListContent
          organizationId={organizationId}
          projectSlug={projectSlug}
          onPlaylistCreated={onPlaylistCreated}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
