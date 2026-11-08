import { Music } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export interface SongListItemSong {
  id: string;
  title: string;
  artist?: string | null;
  type?: "original" | "cover" | null;
  bpm?: number | null;
}

export function SongListItem({
  song,
  leading,
  trailing,
  duration,
  projectSlug,
}: {
  song: SongListItemSong;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  duration?: React.ReactNode;
  projectSlug: string;
}) {
  const { t } = useLingui();

  return (
    <Link
      to="/projects/$projectSlug/songs/$songId"
      params={{ projectSlug, songId: song.id }}
      draggable={false}
      className="rounded-xs hover:bg-muted/50 flex items-center gap-2.5 p-1 no-underline opacity-70 hover:opacity-100"
    >
      {leading ?? <Music className="size-4 text-muted-foreground" />}
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="truncate text-sm font-medium">
          {song.title} {song.type !== "original" && song.artist ? `- ${song.artist}` : ""}
        </span>
        {song.type && (
          <Badge variant="secondary">{song.type === "original" ? t`Original` : t`Cover`}</Badge>
        )}
      </span>
      {song.bpm != null && (
        <Badge variant="secondary" className="tabular-nums">
          {song.bpm} <Trans>BPM</Trans>
        </Badge>
      )}
      {duration && (
        <span className="min-w-[5ch] shrink-0 text-end font-mono text-muted-foreground">
          {duration}
        </span>
      )}
      {trailing}
    </Link>
  );
}
