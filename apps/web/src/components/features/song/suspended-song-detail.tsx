import { Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useLingui } from "@lingui/react/macro";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SongDetail } from "@/components/ui/song/song-detail";
import {
  SongDialog,
  type SongDialogState,
  type SongDialogSubmitValues,
} from "@/components/ui/song/song-dialog";
import {
  getSongQueryOptions,
  useDeleteSongMutation,
  useUpdateSongLyricsMutation,
  useUpdateSongMutation,
} from "@/services/resources/song";
import { useSyncPageMeta } from "@/contexts/page-meta";
import { SuspendedSongAttachments } from "./suspended-song-attachments";

const LYRICS_AUTOSAVE_DEBOUNCE_MS = 1000;

export interface SuspendedSongDetailProps {
  songId: string;
  organizationId: string;
  pathname: string;
  onBack: () => void;
}

function SongDetailContent({ songId, organizationId, pathname, onBack }: SuspendedSongDetailProps) {
  const { t } = useLingui();
  const { data: song } = useSuspenseQuery(getSongQueryOptions({ songId, organizationId }));
  const [dialogState, setDialogState] = useState<SongDialogState>(null);
  const [lyrics, setLyrics] = useState(() => song.lyrics ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lyricsRef = useRef(lyrics);
  lyricsRef.current = lyrics;

  useSyncPageMeta(pathname, song.title, song.title);

  const updateSongMutation = useUpdateSongMutation({ onSuccess: () => setDialogState(null) });
  const updateLyricsMutation = useUpdateSongLyricsMutation({
    organizationId,
    onError: () => toast.add({ type: "error", title: t`Failed to save lyrics` }),
  });
  const deleteSongMutation = useDeleteSongMutation({
    organizationId,
    onSuccess: () => {
      toast.add({ type: "success", title: t`Song deleted` });
      onBack();
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        updateLyricsMutation.mutate({ id: song.id, lyrics: lyricsRef.current || null });
      }
    };
  }, [song.id, updateLyricsMutation.mutate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.add({ type: "success", title: t`Link copied to clipboard` });
  };

  const handleLyricsChange = (markdown: string) => {
    setLyrics(markdown);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateLyricsMutation.mutate({ id: song.id, lyrics: markdown || null });
    }, LYRICS_AUTOSAVE_DEBOUNCE_MS);
  };

  const handleDialogSubmit = async (values: SongDialogSubmitValues) => {
    await updateSongMutation.mutateAsync({ id: song.id, organizationId, ...values });
  };

  const handleDelete = async () => {
    await deleteSongMutation.mutateAsync({ id: song.id });
  };

  return (
    <>
      <SongDetail
        song={song}
        lyrics={lyrics}
        onLyricsChange={handleLyricsChange}
        onShare={handleShare}
        onEdit={() => setDialogState({ mode: "edit", song })}
        onDelete={handleDelete}
        attachments={<SuspendedSongAttachments songId={song.id} organizationId={organizationId} />}
      />
      <SongDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}

function SongDetailSkeleton() {
  return (
    <div className="flex flex-wrap-reverse gap-9">
      <div className="flex min-w-[280px] flex-[999_1_400px] flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="flex min-w-[200px] max-w-[280px] flex-[1_1_220px] flex-col gap-2">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function SongDetailError({ error, onBack }: { error: unknown; onBack: () => void }) {
  const { t } = useLingui();
  const isNotFound = error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">
        {isNotFound ? t`Song not found` : t`Something went wrong`}
      </h1>
      {isNotFound && (
        <p className="text-muted-foreground">{t`This song doesn't exist or has been deleted.`}</p>
      )}
      <Button type="button" onClick={onBack}>
        {t`Back to songs`}
      </Button>
    </div>
  );
}

export function SuspendedSongDetail({
  songId,
  organizationId,
  pathname,
  onBack,
}: SuspendedSongDetailProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <SongDetailError error={error} onBack={onBack} />}
    >
      <Suspense fallback={<SongDetailSkeleton />}>
        <SongDetailContent
          songId={songId}
          organizationId={organizationId}
          pathname={pathname}
          onBack={onBack}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
