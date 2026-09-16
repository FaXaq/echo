import { useState } from "react";
import { Loader2, Music, Pause, Play } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { toast } from "@/components/ui/toast";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { getSongAudioVersionsQueryOptions } from "@/services/resources/song";

export interface SongListItemSong {
  id: string;
  title: string;
  artist?: string | null;
  type?: "original" | "cover" | null;
}

export function SongListItem({
  song,
  trailing,
  projectSlug,
  organizationId,
}: {
  song: SongListItemSong;
  trailing?: React.ReactNode;
  projectSlug: string;
  organizationId: string;
}) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const activeFile = useAudioPlayerStore((s) => s.file);
  const status = useAudioPlayerStore((s) => s.status);
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);
  const toggle = useAudioPlayerStore((s) => s.toggle);

  const isActive = activeFile?.songId === song.id;

  const handlePlay = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isActive) {
      toggle();
      return;
    }

    setIsLoading(true);
    try {
      const versions = await queryClient.fetchQuery(
        getSongAudioVersionsQueryOptions({ songId: song.id, organizationId }),
      );
      const file = versions.final[0] ?? versions.demo[0];
      if (!file) {
        toast.add({ type: "error", title: t`No audio for this song` });
        return;
      }
      requestPlay({
        id: file.id,
        filename: file.filename,
        downloadUrl: file.downloadUrl,
        contextLabel: song.title,
        songId: song.id,
      });
    } catch {
      toast.add({ type: "error", title: t`Failed to load audio` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      to="/projects/$projectSlug/songs/$songId"
      params={{ projectSlug, songId: song.id }}
      className="rounded-xs hover:bg-muted/50 flex items-center gap-2.5 p-1 no-underline opacity-70 hover:opacity-100"
    >
      <button
        type="button"
        onClick={handlePlay}
        aria-label={isActive && status === "playing" ? t`Pause` : t`Play`}
        className="flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {isLoading || (isActive && status === "loading") ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isActive && status === "playing" ? (
          <Pause className="size-4" />
        ) : isActive ? (
          <Play className="size-4" />
        ) : (
          <Music className="size-4" />
        )}
      </button>
      <span className="flex-1 text-sm font-medium">
        {song.title} {song.type !== "original" && song.artist ? `- ${song.artist}` : ""}
      </span>
      {song.type && (
        <Badge variant="secondary">{song.type === "original" ? t`Original` : t`Cover`}</Badge>
      )}
      {trailing}
    </Link>
  );
}
