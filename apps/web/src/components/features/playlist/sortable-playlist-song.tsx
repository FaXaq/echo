import { useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useLingui } from "@lingui/react/macro";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongListItem } from "@/components/ui/song/song-list-item";
import { SuspendedSongPlayButton } from "@/components/features/song/suspended-song-play-button";
import { cn } from "@/lib/utils";

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
  const rowRef = useRef<HTMLDivElement>(null);
  const { ref, isDragging } = useSortable({
    id: song.songId,
    index,
    type: "song",
    accept: "song",
    // The row's own content is a real <a href> (SongListItem navigates on click), which
    // dnd-kit refuses to drag from by default. Making the whole row its own handle bypasses
    // that guard so the entire line is draggable instead of needing a dedicated grip icon.
    handle: rowRef,
  });

  return (
    <div
      ref={(element) => {
        rowRef.current = element;
        ref(element);
      }}
      className={cn(
        "cursor-grab touch-none select-none transition-opacity active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
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
  );
}
