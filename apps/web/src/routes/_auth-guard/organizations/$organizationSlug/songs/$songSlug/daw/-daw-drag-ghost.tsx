import { cn } from "@/lib/utils";
import { PIXELS_PER_MEASURE, TRACK_HEIGHT, RULER_HEIGHT } from "./-constants";
import { useDawContext } from "./-daw-context";

type DragGhost = {
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
  durationMs?: number;
  uploading?: boolean;
} | null;

interface DawDragGhostOverlayProps {
  dragGhost: DragGhost;
}

export function DawDragGhostOverlay({ dragGhost }: DawDragGhostOverlayProps) {
  const { bpm } = useDawContext();
  if (!dragGhost) return null;

  const secondsPerMeasure = (4 * 60) / bpm;
  const { durationMs, uploading } = dragGhost;
  const ghostWidth = durationMs
    ? Math.max(PIXELS_PER_MEASURE, (durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE)
    : PIXELS_PER_MEASURE * 2;
  const durationLabel = durationMs
    ? durationMs >= 60_000
      ? `${Math.floor(durationMs / 60_000)}m ${String(Math.floor((durationMs % 60_000) / 1000)).padStart(2, "0")}s`
      : `${(durationMs / 1000).toFixed(1)}s`
    : null;

  return (
    <div
      className={cn(
        "absolute pointer-events-none border-2 rounded z-20 flex items-center px-1.5 overflow-hidden",
        uploading ? "border-solid opacity-70 animate-pulse" : "border-dashed opacity-60",
        dragGhost.fileType === "audio"
          ? "border-primary bg-primary/20"
          : "border-emerald-500 bg-emerald-500/20",
      )}
      style={{
        left: (dragGhost.startMeasure - 1) * PIXELS_PER_MEASURE,
        top: RULER_HEIGHT + dragGhost.trackIndex * TRACK_HEIGHT + 4,
        width: ghostWidth,
        height: TRACK_HEIGHT - 8,
      }}
    >
      {durationLabel && (
        <span className="text-xs font-medium truncate leading-none">{durationLabel}</span>
      )}
    </div>
  );
}
