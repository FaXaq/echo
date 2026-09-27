import { useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useLingui } from "@lingui/react/macro";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongListItem } from "@/components/ui/song/song-list-item";
import { SuspendedSongPlayButton } from "@/components/features/song/suspended-song-play-button";
import { cn } from "@/lib/utils";
import { SuspendedSongDuration } from "../song/suspended-song-duration";

export function SortablePlaylistSong({
  song,
  index,
  organizationId,
  projectSlug,
  onRemove,
}: {
  song: { songId: string; title: string; artist: string | null };
  index: number;
  organizationId: string;
  projectSlug: string;
  onRemove: () => void;
}) {
  const { t } = useLingui();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref, isDragging } = useSortable({
    id: song.songId,
    index,
    type: "song",
    accept: "song",
    // A dedicated grip handle keeps the drag surface separate from SongListItem's link/buttons,
    // so a plain click on those still works (dnd-kit treats anything inside `handle` as
    // fair game for dragging, bypassing its usual click-vs-drag guard on interactive elements).
    handle: handleRef,
  });

  return (
    <div ref={ref} className={cn("flex items-center gap-1", isDragging && "opacity-40")}>
      <button
        ref={handleRef}
        type="button"
        aria-label={t`Drag to reorder`}
        className="cursor-grab touch-none p-1 text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <SongListItem
          song={{ ...song, id: song.songId }}
          projectSlug={projectSlug}
          leading={
            <SuspendedSongPlayButton
              songId={song.songId}
              organizationId={organizationId}
              title={song.title}
            />
          }
          duration={<SuspendedSongDuration songId={song.songId} organizationId={organizationId} />}
          trailing={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t`Remove song`}
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
            >
              <X />
            </Button>
          }
        />
      </div>
    </div>
  );
}
