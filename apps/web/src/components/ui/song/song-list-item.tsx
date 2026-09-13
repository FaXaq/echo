import { Music } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";

export interface SongListItemSong {
  title: string;
  artist?: string | null;
  type?: "original" | "cover" | null;
}

export function SongListItem({
  song,
  trailing,
}: {
  song: SongListItemSong;
  trailing?: React.ReactNode;
}) {
  const { t } = useLingui();

  return (
    <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
      <Music className="size-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{song.title}</span>
      {song.artist && <span className="text-xs text-muted-foreground">{song.artist}</span>}
      {song.type && (
        <Badge variant="secondary">{song.type === "original" ? t`Original` : t`Cover`}</Badge>
      )}
      {trailing}
    </div>
  );
}
