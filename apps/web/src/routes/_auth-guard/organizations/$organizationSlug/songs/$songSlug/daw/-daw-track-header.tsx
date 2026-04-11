import { GripVertical } from "lucide-react";
import { Slider } from "@/ui/slider";
import { PhantomInput } from "@/ui/phantom-input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { TRACK_HEIGHT } from "./-constants";
import type { Track } from "./-daw-types";
import { useDawContext } from "./-daw-context";
import { useTranslation } from "react-i18next";

export interface DawTrackHeaderProps {
  track: Track;
  trackIndex: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, trackIndex: number) => void;
  onDeleteTrack: (trackId: string) => void;
  onRenameCommit: (trackId: string, newName: string, currentName: string) => void;
}

export function DawTrackHeader({
  track,
  trackIndex,
  onMouseDown,
  onDeleteTrack,
  onRenameCommit,
}: DawTrackHeaderProps) {
  const { editingTrackId, setEditingTrackId, onVolumeChanged } = useDawContext();
  const { t } = useTranslation("songs");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="border-b px-2 flex flex-row items-center gap-2 select-none"
          style={{ height: TRACK_HEIGHT }}
        >
          {/* Grip handle for reordering */}
          <div
            data-drag-handle
            className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            onMouseDown={(e) => onMouseDown(e, trackIndex)}
            title={t("Drag to reorder track")}
          >
            <GripVertical size={16} />
          </div>

          {/* Track controls */}
          <div className="flex flex-col justify-center gap-0.5 flex-1 min-w-0">
            <PhantomInput
              defaultValue={track.name}
              autoFocus={editingTrackId === track.id}
              onFocus={() => setEditingTrackId(track.id)}
              onBlur={(e) => {
                setEditingTrackId(null);
                onRenameCommit(track.id, e.target.value, track.name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") e.currentTarget.blur();
              }}
            />
            <div className="flex items-center gap-1">
              <Slider
                min={-60}
                max={6}
                step={0.1}
                value={[track.volume]}
                onValueChange={([v]) => onVolumeChanged(track.id, v)}
                className="flex-1 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:rounded-sm"
              />
              <span className="text-xs text-muted-foreground w-14 text-right shrink-0">
                {track.volume.toFixed(1)} dB
              </span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onDeleteTrack(track.id)}
        >
          {t("Delete track")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
