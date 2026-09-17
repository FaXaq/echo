import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, Pause, Play, SquircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { getSongDefaultAudioQueryOptions } from "@/services/resources/song";

function SongPlayButtonContent({
  songId,
  organizationId,
  title,
}: {
  songId: string;
  organizationId: string;
  title: string;
}) {
  const { t } = useLingui();
  const { data: file } = useSuspenseQuery(
    getSongDefaultAudioQueryOptions({ songId, organizationId }),
  );
  const activeFile = useAudioPlayerStore((s) => s.file);
  const status = useAudioPlayerStore((s) => s.status);
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);
  const toggle = useAudioPlayerStore((s) => s.toggle);

  if (!file)
    return (
      <div className="size-7 flex justify-center items-center opacity-40">
        <SquircleDashed size={16} />
      </div>
    );

  const isActive = activeFile?.songId === songId;
  const isPlaying = isActive && status === "playing";
  const isLoading = isActive && status === "loading";

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActive) {
      toggle();
      return;
    }

    requestPlay({
      id: file.id,
      filename: file.filename,
      downloadUrl: file.downloadUrl,
      contextLabel: title,
      songId,
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isPlaying ? t`Pause` : t`Play`}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause /> : <Play />}
    </Button>
  );
}

export function SuspendedSongPlayButton(props: {
  songId: string;
  organizationId: string;
  title: string;
}) {
  return (
    <ErrorBoundary fallbackRender={() => <div className="size-7" />}>
      <Suspense
        fallback={
          <div className="flex size-7 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SongPlayButtonContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
