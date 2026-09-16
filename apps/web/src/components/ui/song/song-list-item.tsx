import { Music } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

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
}: {
  song: SongListItemSong;
  trailing?: React.ReactNode;
  projectSlug: string;
}) {
  const { t } = useLingui();

  return (
    <Link
      to="/projects/$projectSlug/songs/$songId"
      params={{ projectSlug, songId: song.id }}
      className="rounded-xs hover:bg-muted/50 flex items-center gap-2.5 p-1 no-underline opacity-70 hover:opacity-100"
    >
      <Music className="size-4 text-muted-foreground" />
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
