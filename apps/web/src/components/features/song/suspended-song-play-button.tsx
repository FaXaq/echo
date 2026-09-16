import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { getSongAudioVersionsQueryOptions } from "@/services/resources/song";

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
  const { data: versions } = useSuspenseQuery(
    getSongAudioVersionsQueryOptions({ songId, organizationId }),
  );
  const activeFile = useAudioPlayerStore((s) => s.file);
  const status = useAudioPlayerStore((s) => s.status);
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);
  const toggle = useAudioPlayerStore((s) => s.toggle);

  const file = versions.final[0] ?? versions.demo[0];
  if (!file) return <div className="size-7" />;

  const isPlaying = activeFile?.songId === songId && status === "playing";

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (activeFile?.songId === songId) {
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
      aria-label={isPlaying ? t`Pause` : t`Play`}
    >
      {isPlaying ? <Pause /> : <Play />}
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
