import { ListMusic } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Plural } from "@lingui/react/macro";
import { formatDuration } from "@/lib/file";

export interface PlaylistListItemPlaylist {
  id: string;
  title: string;
  description?: string | null;
  songCount: number;
  totalDurationSeconds: number;
}

export function PlaylistListItem({
  playlist,
  projectSlug,
}: {
  playlist: PlaylistListItemPlaylist;
  projectSlug: string;
}) {
  return (
    <Link
      to="/projects/$projectSlug/playlists/$playlistId"
      params={{ projectSlug, playlistId: playlist.id }}
      draggable={false}
      className="rounded-xs hover:bg-muted/50 flex items-center gap-2.5 p-1 no-underline opacity-70 hover:opacity-100"
    >
      <ListMusic className="size-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{playlist.title}</span>
      {playlist.description && (
        <span className="truncate text-xs text-muted-foreground">{playlist.description}</span>
      )}
      <span className="text-xs text-muted-foreground">
        <Plural value={playlist.songCount} one="# song" other="# songs" /> ·{" "}
        {formatDuration(playlist.totalDurationSeconds)}
      </span>
    </Link>
  );
}
