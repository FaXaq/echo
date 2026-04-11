import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { PIXELS_PER_MEASURE, TRACK_HEIGHT } from "./-constants";
import type { MidiClip } from "./-daw-types";
import { stripExtension, computeClipWidthPx } from "./-clip-utils";

export interface MidiClipViewProps {
  clip: MidiClip;
  isSelected: boolean;
  selectionCount: number;
  downloadUrl?: string;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: MidiClip) => void;
  onDelete: () => void;
  onDeleteSelection: () => void;
}

export function MidiClipView({
  clip,
  isSelected,
  selectionCount,
  downloadUrl,
  secondsPerMeasure,
  onMouseDown,
  onDelete,
  onDeleteSelection,
}: MidiClipViewProps) {
  const { t } = useTranslation("songs");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayName = clip.name ?? stripExtension(clip.file.filename);
  const clipWidth = computeClipWidthPx(clip.durationMs ?? undefined, secondsPerMeasure);

  useEffect(() => {
    if (!downloadUrl || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(downloadUrl);
        const buf = await res.arrayBuffer();
        const { Midi } = await import("@tonejs/midi");
        const midi = new Midi(buf);
        if (cancelled || !canvasRef.current) return;

        const notes = midi.tracks.flatMap((t) => t.notes);
        const totalDuration = midi.duration;
        if (notes.length === 0 || totalDuration === 0) return;

        const minPitch = Math.min(...notes.map((n) => n.midi));
        const maxPitch = Math.max(...notes.map((n) => n.midi));
        const pitchRange = Math.max(1, maxPitch - minPitch);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(16,185,129,0.7)";

        const noteH = Math.max(1, canvas.height / (pitchRange + 1));
        for (const note of notes) {
          const x = (note.time / totalDuration) * canvas.width;
          const w = Math.max(1, (note.duration / totalDuration) * canvas.width);
          const normalizedPitch =
            minPitch === maxPitch ? 0.5 : (note.midi - minPitch) / pitchRange;
          const y = canvas.height - normalizedPitch * canvas.height - noteH;
          ctx.fillRect(x, y, w, noteH);
        }
      } catch {
        // silent: clip shows without preview
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [downloadUrl]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-clip
          className={cn(
            "absolute top-1 bottom-1 rounded bg-emerald-500/20 border cursor-grab active:cursor-grabbing overflow-hidden select-none flex items-center px-2",
            isSelected
              ? "border-emerald-500 ring-2 ring-emerald-500 ring-inset"
              : "border-emerald-500/40"
          )}
          style={{
            left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
            width: clipWidth,
          }}
          onMouseDown={(e) => onMouseDown(e, clip)}
          onContextMenu={(e) => e.stopPropagation()}
          title={clip.file.filename}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={clipWidth}
            height={TRACK_HEIGHT - 8}
          />
          <span className="relative z-10 text-xs truncate text-emerald-700 dark:text-emerald-300">
            ♩ {displayName}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {selectionCount > 1 ? (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDeleteSelection}
          >
            {t("Delete {{count}} clips", { count: selectionCount })}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            {t("Delete clip")}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
