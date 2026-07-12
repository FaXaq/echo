import { useRef, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { PhantomInput } from "@/ui/phantom-input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import type { AudioClip } from "./-daw-types";
import { stripExtension, computeClipWidthPx } from "./-clip-utils";
import { useDawContext } from "./-daw-context";

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
  const { t } = useTranslation("songs");
  const { pixelsPerMeasure } = useDawContext();
  const [pendingDelete, setPendingDelete] = useState<"single" | "selection" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayName = clip.name ?? stripExtension(clip.file.filename);
  const clipWidth = computeClipWidthPx(clip.durationMs ?? undefined, secondsPerMeasure, pixelsPerMeasure);

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
        ctx.fillStyle = "rgba(99,102,241,0.45)";
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
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-clip
          className={cn(
            "absolute top-1 bottom-1 rounded-none bg-indigo-50 dark:bg-indigo-400/15 border-t-2 cursor-grab active:cursor-grabbing overflow-hidden select-none",
            isSelected
              ? "border-t-indigo-500 dark:border-t-indigo-400 shadow-[inset_0_0_0_1px] shadow-indigo-200 dark:shadow-indigo-400/30"
              : "border-t-indigo-300 dark:border-t-indigo-400/60"
          )}
          style={{
            left: (clip.startMeasure - 1) * pixelsPerMeasure,
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
              <span className="font-mono text-xs font-semibold truncate text-indigo-700 dark:text-indigo-300">{displayName}</span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleExportClip} disabled={!downloadUrl}>
          {t("Export clip")}
        </ContextMenuItem>
        {selectionCount > 1 ? (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setPendingDelete("selection")}
          >
            {t("Delete {{count}} clips", { count: selectionCount })}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setPendingDelete("single")}
          >
            {t("Delete clip")}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>

    <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pendingDelete === "selection"
              ? t("Delete {{count}} clips", { count: selectionCount })
              : t("Delete clip")}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("This action cannot be undone.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingDelete(null)}>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pendingDelete === "selection") onDeleteSelection();
              else onDelete();
              setPendingDelete(null);
            }}
          >
            {t("Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
