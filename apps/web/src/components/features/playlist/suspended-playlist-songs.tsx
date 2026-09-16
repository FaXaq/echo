import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Skeleton } from "@/components/ui/skeleton";
import { SongListItem } from "@/components/ui/song/song-list-item";
import { getPlaylistSongsQueryOptions } from "@/services/resources/playlist";

function PlaylistSongsContent({
  playlistId,
  organizationId,
  projectSlug,
}: {
  playlistId: string;
  organizationId: string;
  projectSlug: string;
}) {
  const { t } = useLingui();
  const { data: songs } = useSuspenseQuery(
    getPlaylistSongsQueryOptions({ playlistId, organizationId }),
  );

  if (songs.length === 0) {
    return <p className="text-xs text-muted-foreground">{t`No songs in this playlist.`}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {songs.map((song) => (
        <SongListItem
          key={song.songId}
          song={{ ...song, id: song.songId }}
          projectSlug={projectSlug}
          organizationId={organizationId}
        />
      ))}
    </div>
  );
}

function PlaylistSongsError() {
  const { t } = useLingui();
  return <p className="text-xs text-destructive">{t`Couldn't load songs`}</p>;
}

export function SuspendedPlaylistSongs({
  playlistId,
  organizationId,
  projectSlug,
}: {
  playlistId: string;
  organizationId: string;
  projectSlug: string;
}) {
  return (
    <ErrorBoundary FallbackComponent={PlaylistSongsError}>
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <PlaylistSongsContent
          playlistId={playlistId}
          organizationId={organizationId}
          projectSlug={projectSlug}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
