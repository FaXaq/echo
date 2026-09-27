import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useLingui } from "@lingui/react/macro";
import { usePostHog } from "posthog-js/react";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistDetail } from "@/components/ui/playlist/playlist-detail";
import { PlaylistDialog, type PlaylistDialogState } from "@/components/ui/playlist/playlist-dialog";
import type { MarkdownSaveStatus } from "@/components/ui/markdown-editor";
import {
  getPlaylistQueryOptions,
  getPlaylistSongsQueryOptions,
  useAddSongToPlaylistMutation,
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
  useRemoveSongFromPlaylistMutation,
  useMoveSongInPlaylistMutation,
} from "@/services/resources/playlist";
import { useSyncPageMeta } from "@/contexts/page-meta";
import { SongPickerCombobox } from "./song-picker-combobox";
import { SortablePlaylistSong } from "./sortable-playlist-song";
import { getSongDefaultAudioQueryOptions } from "@/services/resources/song";

const DESCRIPTION_AUTOSAVE_DEBOUNCE_MS = 300;

export interface SuspendedPlaylistDetailProps {
  playlistId: string;
  organizationId: string;
  pathname: string;
  onBack: () => void;
  projectSlug: string;
}

function PlaylistDetailContent({
  projectSlug,
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

  const fileQueries = useSuspenseQueries({
    queries: songs.map((s) =>
      getSongDefaultAudioQueryOptions({ songId: s.songId, organizationId }),
    ),
  });
  const playlistDurationInSeconds = fileQueries
    .map((q) => q.data?.durationSeconds ?? 0)
    .reduce((a, b) => a + b, 0);

  const [dialogState, setDialogState] = useState<PlaylistDialogState>(null);
  const [description, setDescription] = useState(() => playlist.description ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descriptionRef = useRef(description);
  descriptionRef.current = description;
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  useSyncPageMeta(pathname, playlist.title, playlist.title);

  const updatePlaylistMutation = useUpdatePlaylistMutation({
    organizationId,
    onSuccess: () => {
      posthog.capture("playlist_updated");
      setDialogState(null);
    },
  });
  const updateDescriptionMutation = useUpdatePlaylistMutation({
    organizationId,
    onError: () => toast.add({ type: "error", title: t`Failed to save description` }),
  });
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
  const moveSongMutation = useMoveSongInPlaylistMutation({ organizationId });

  const songsById = new Map(songs.map((song) => [song.songId, song]));
  const [order, setOrder] = useState(() => songs.map((song) => song.songId));
  const orderRef = useRef(order);
  const dragSnapshotRef = useRef(order);

  useEffect(() => {
    const next = songs.map((song) => song.songId);
    orderRef.current = next;
    setOrder(next);
  }, [songs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        updateDescriptionMutation.mutate({
          id: playlistRef.current.id,
          title: playlistRef.current.title,
          description: descriptionRef.current || undefined,
        });
      }
    };
  }, [playlist.id, updateDescriptionMutation.mutate]);

  const handleDescriptionChange = (markdown: string) => {
    setDescription(markdown);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      updateDescriptionMutation.mutate({
        id: playlistRef.current.id,
        title: playlistRef.current.title,
        description: markdown || undefined,
      });
    }, DESCRIPTION_AUTOSAVE_DEBOUNCE_MS);
  };

  const descriptionSaveStatus: MarkdownSaveStatus =
    updateDescriptionMutation.isPending || debounceRef.current !== null
      ? "saving"
      : updateDescriptionMutation.isSuccess
        ? "saved"
        : "idle";

  const handleDialogSubmit = async (values: { title: string }) => {
    await updatePlaylistMutation.mutateAsync({
      id: playlist.id,
      title: values.title,
      description: descriptionRef.current || undefined,
    });
  };

  const handleDelete = async () => {
    await deletePlaylistMutation.mutateAsync({ id: playlist.id });
  };

  const persistSongMove = (songId: string) => {
    const finalOrder = orderRef.current;
    const index = finalOrder.indexOf(songId);
    const beforeId = index > 0 ? finalOrder[index - 1] : null;
    const afterId = index < finalOrder.length - 1 ? finalOrder[index + 1] : null;

    moveSongMutation.mutate(
      { playlistId: playlist.id, songId, beforeId, afterId },
      { onError: () => toast.add({ title: t`Couldn't move song`, type: "error" }) },
    );
  };

  return (
    <>
      <PlaylistDetail
        playlist={playlist}
        description={description}
        onDescriptionChange={handleDescriptionChange}
        descriptionSaveStatus={descriptionSaveStatus}
        onEdit={() => setDialogState({ mode: "edit", playlist })}
        onDelete={handleDelete}
        durationInSeconds={playlistDurationInSeconds}
        songsList={
          <DragDropProvider
            onDragStart={() => {
              dragSnapshotRef.current = orderRef.current;
            }}
            onDragOver={(event) => {
              orderRef.current = move(orderRef.current, event);
              setOrder(orderRef.current);
            }}
            onDragEnd={(event) => {
              const { source, canceled } = event.operation;
              if (canceled) {
                orderRef.current = dragSnapshotRef.current;
                setOrder(dragSnapshotRef.current);
                return;
              }
              if (source) persistSongMove(String(source.id));
            }}
          >
            <div className="flex flex-col gap-0">
              {order.map((songId, index) => {
                const song = songsById.get(songId);
                if (!song) return null;
                return (
                  <SortablePlaylistSong
                    key={songId}
                    song={song}
                    index={index}
                    organizationId={organizationId}
                    projectSlug={projectSlug}
                    onRemove={() => removeSongMutation.mutate({ playlistId: playlist.id, songId })}
                  />
                );
              })}
            </div>
          </DragDropProvider>
        }
        addSongPicker={
          <SongPickerCombobox
            organizationId={organizationId}
            selectedSongs={songs.map((song) => ({
              id: song.songId,
              title: song.title,
              artist: song.artist,
            }))}
            onAdd={(songId) => addSongMutation.mutate({ playlistId: playlist.id, songId })}
          />
        }
      />
      <PlaylistDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleDialogSubmit}
      />
    </>
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
  projectSlug,
}: SuspendedPlaylistDetailProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <PlaylistDetailError error={error} onBack={onBack} />}
    >
      <Suspense fallback={<PlaylistDetailSkeleton />}>
        <PlaylistDetailContent
          projectSlug={projectSlug}
          playlistId={playlistId}
          organizationId={organizationId}
          pathname={pathname}
          onBack={onBack}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
