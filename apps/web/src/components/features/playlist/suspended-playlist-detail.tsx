import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useLingui } from "@lingui/react/macro";
import { usePostHog } from "posthog-js/react";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistDetail } from "@/components/ui/playlist/playlist-detail";
import { SongListItem } from "@/components/ui/song/song-list-item";
import {
  getPlaylistQueryOptions,
  getPlaylistSongsQueryOptions,
  useAddSongToPlaylistMutation,
  useDeletePlaylistMutation,
  useRemoveSongFromPlaylistMutation,
} from "@/services/resources/playlist";
import { useSyncPageMeta } from "@/contexts/page-meta";
import { SongPickerCombobox } from "./song-picker-combobox";

export interface SuspendedPlaylistDetailProps {
  playlistId: string;
  organizationId: string;
  pathname: string;
  onBack: () => void;
}

function PlaylistDetailContent({
  playlistId,
  organizationId,
  pathname,
  onBack,
}: SuspendedPlaylistDetailProps) {
  const { t } = useLingui();
  const posthog = usePostHog();
  const { data: playlist } = useSuspenseQuery(
    getPlaylistQueryOptions({ playlistId, organizationId }),
  );
  const { data: songs } = useSuspenseQuery(
    getPlaylistSongsQueryOptions({ playlistId, organizationId }),
  );

  useSyncPageMeta(pathname, playlist.title, playlist.title);

  const deletePlaylistMutation = useDeletePlaylistMutation({
    organizationId,
    onSuccess: () => {
      posthog.capture("playlist_deleted");
      toast.add({ type: "success", title: t`Playlist deleted` });
      onBack();
    },
  });
  const addSongMutation = useAddSongToPlaylistMutation({ organizationId });
  const removeSongMutation = useRemoveSongFromPlaylistMutation({ organizationId });

  const handleDelete = async () => {
    await deletePlaylistMutation.mutateAsync({ id: playlist.id });
  };

  return (
    <PlaylistDetail
      playlist={playlist}
      onDelete={handleDelete}
      songsPicker={
        <>
          {songs.map((song) => (
            <SongListItem
              key={song.songId}
              song={song}
              trailing={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t`Remove song`}
                  onClick={() =>
                    removeSongMutation.mutate({ playlistId: playlist.id, songId: song.songId })
                  }
                >
                  <X />
                </Button>
              }
            />
          ))}
          <SongPickerCombobox
            organizationId={organizationId}
            selectedSongs={songs.map((song) => ({
              id: song.songId,
              title: song.title,
              artist: song.artist,
            }))}
            onAdd={(songId) => addSongMutation.mutate({ playlistId: playlist.id, songId })}
          />
        </>
      }
    />
  );
}

function PlaylistDetailSkeleton() {
  return (
    <div className="flex flex-wrap-reverse gap-9">
      <div className="flex min-w-[280px] flex-[999_1_400px] flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="flex min-w-[200px] max-w-[280px] flex-[1_1_220px] flex-col gap-2">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function PlaylistDetailError({ error, onBack }: { error: unknown; onBack: () => void }) {
  const { t } = useLingui();
  const isNotFound = error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">
        {isNotFound ? t`Playlist not found` : t`Something went wrong`}
      </h1>
      {isNotFound && (
        <p className="text-muted-foreground">{t`This playlist doesn't exist or has been deleted.`}</p>
      )}
      <Button type="button" onClick={onBack}>
        {t`Back to playlists`}
      </Button>
    </div>
  );
}

export function SuspendedPlaylistDetail({
  playlistId,
  organizationId,
  pathname,
  onBack,
}: SuspendedPlaylistDetailProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <PlaylistDetailError error={error} onBack={onBack} />}
    >
      <Suspense fallback={<PlaylistDetailSkeleton />}>
        <PlaylistDetailContent
          playlistId={playlistId}
          organizationId={organizationId}
          pathname={pathname}
          onBack={onBack}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
