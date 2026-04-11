import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PhantomInput } from "@/ui/phantom-input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { PIXELS_PER_MEASURE } from "./-constants";
import type { AudioClip } from "./-daw-types";
import { stripExtension, computeClipWidthPx } from "./-clip-utils";

export interface AudioClipViewProps {
  clip: AudioClip;
  isEditing: boolean;
  isSelected: boolean;
  selectionCount: number;
  downloadUrl: string | undefined;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: AudioClip) => void;
  onEditStart: () => void;
  onEditCommit: (name: string) => void;
  onDelete: () => void;
  onDeleteSelection: () => void;
}

export function AudioClipView({
  clip,
  isEditing,
  isSelected,
  selectionCount,
  downloadUrl,
  secondsPerMeasure,
  onMouseDown,
  onEditStart,
  onEditCommit,
  onDelete,
  onDeleteSelection,
}: AudioClipViewProps) {
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
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(buf);
        await audioCtx.close();
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const data = decoded.getChannelData(0);
        const numBins = canvas.width;
        const samplesPerBin = Math.ceil(data.length / numBins);
        const mid = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(99,102,241,0.35)";
        for (let i = 0; i < numBins; i++) {
          let peak = 0;
          for (let j = 0; j < samplesPerBin; j++) {
            const idx = i * samplesPerBin + j;
            if (idx < data.length) peak = Math.max(peak, Math.abs(data[idx]));
          }
          const h = Math.max(1, peak * mid);
          ctx.fillRect(i, mid - h, 1, h * 2);
        }
      } catch {
        // skip clips that fail to decode
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [downloadUrl]);

  const handleExportClip = useCallback(() => {
    if (!downloadUrl) return;
    const ext = clip.file.filename.split(".").pop() ?? "mp3";
    const clipName = clip.name ?? stripExtension(clip.file.filename);
    fetch(downloadUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${clipName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      });
  }, [downloadUrl, clip]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-clip
          className={cn(
            "absolute top-1 bottom-1 rounded bg-primary/20 border cursor-grab active:cursor-grabbing overflow-hidden select-none",
            isSelected
              ? "border-primary ring-2 ring-primary ring-inset"
              : "border-primary/40"
          )}
          style={{
            left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
            width: clipWidth,
          }}
          onMouseDown={(e) => onMouseDown(e, clip)}
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          title={clip.file.filename}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 px-2 h-full flex items-center">
            {isEditing ? (
              <PhantomInput
                defaultValue={displayName}
                autoFocus
                className="text-xs"
                onBlur={(e) => onEditCommit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.currentTarget.value = displayName;
                    e.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <span className="text-xs truncate">{displayName}</span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleExportClip} disabled={!downloadUrl}>
          Export clip
        </ContextMenuItem>
        {selectionCount > 1 ? (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDeleteSelection}
          >
            Delete {selectionCount} clips
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            Delete clip
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
