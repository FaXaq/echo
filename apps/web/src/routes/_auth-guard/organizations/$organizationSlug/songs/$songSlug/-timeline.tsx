import { useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];

const PIXELS_PER_MEASURE = 120;
const TRACK_HEIGHT = 48;
const RULER_HEIGHT = 32;
const TOTAL_MEASURES = 32;
const LEFT_PANEL_WIDTH = 200;

interface TimelineProps {
  tracks: Track[];
  clips: AudioClip[];
  bpm: number;
  onClipPositionChanged: (clip: AudioClip) => void;
  onVolumeChanged: (trackId: string, volume: number) => void;
}

export function Timeline({
  tracks,
  clips,
  bpm,
  onClipPositionChanged,
  onVolumeChanged,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    clipId: string;
    startX: number;
    originalMeasure: number;
  } | null>(null);

  const updatePosition = trpc.organization.audioClip.updatePosition.useMutation();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clip: AudioClip) => {
      e.preventDefault();
      draggingRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        originalMeasure: clip.startMeasure,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const dx = moveEvent.clientX - draggingRef.current.startX;
        const measuresOffset = dx / PIXELS_PER_MEASURE;
        const newMeasure = Math.max(
          1,
          draggingRef.current.originalMeasure + measuresOffset,
        );
        const snapped = Math.round(newMeasure * 4) / 4;
        onClipPositionChanged({ ...clip, startMeasure: snapped });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingRef.current) return;
        const dx = upEvent.clientX - draggingRef.current.startX;
        const measuresOffset = dx / PIXELS_PER_MEASURE;
        const newMeasure = Math.max(
          1,
          draggingRef.current.originalMeasure + measuresOffset,
        );
        const snapped = Math.round(newMeasure * 4) / 4;

        updatePosition.mutate(
          { clipId: clip.id, startMeasure: snapped },
          {
            onSuccess: (updated) => onClipPositionChanged(updated),
            onError: () =>
              onClipPositionChanged({
                ...clip,
                startMeasure: draggingRef.current!.originalMeasure,
              }),
          },
        );

        draggingRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onClipPositionChanged, updatePosition],
  );

  const totalWidth = TOTAL_MEASURES * PIXELS_PER_MEASURE;
  const secondsPerMeasure = (4 * 60) / bpm;

  return (
    <div className="border rounded-lg overflow-hidden flex flex-row">
      {/* Left panel — fixed, no horizontal scroll */}
      <div className="flex-shrink-0 border-r" style={{ width: LEFT_PANEL_WIDTH }}>
        <div className="bg-muted border-b" style={{ height: RULER_HEIGHT }} />
        {tracks.map((track) => (
          <div
            key={track.id}
            className="border-b px-2 flex flex-col justify-center gap-0.5"
            style={{ height: TRACK_HEIGHT }}
          >
            <span className="text-[10px] font-medium truncate">{track.name}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={track.volume}
              onChange={(e) => onVolumeChanged(track.id, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
        {tracks.length === 0 && <div style={{ height: TRACK_HEIGHT }} />}
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-x-auto min-w-0" ref={containerRef}>
        <div style={{ width: totalWidth }}>
          {/* Ruler */}
          <div
            className="flex bg-muted border-b"
            style={{ height: RULER_HEIGHT }}
          >
            {Array.from({ length: TOTAL_MEASURES }, (_, i) => (
              <div
                key={i}
                className="border-r border-border flex items-center px-1 shrink-0"
                style={{ width: PIXELS_PER_MEASURE }}
              >
                <span className="text-xs text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Track lanes */}
          {tracks.map((track) => {
            const trackClips = clips.filter((c) => c.trackId === track.id);
            return (
              <div
                key={track.id}
                className="relative border-b bg-background"
                style={{ height: TRACK_HEIGHT }}
              >
                {/* Grid lines */}
                {Array.from({ length: TOTAL_MEASURES }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-border/30"
                    style={{ left: (i + 1) * PIXELS_PER_MEASURE }}
                  />
                ))}

                {/* Clips */}
                {trackClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="absolute top-1 bottom-1 rounded bg-primary/20 border border-primary/40 cursor-grab active:cursor-grabbing flex items-center px-2 select-none"
                    style={{
                      left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
                      width: Math.max(
                        PIXELS_PER_MEASURE,
                        clip.durationMs
                          ? (clip.durationMs / 1000 / secondsPerMeasure) *
                            PIXELS_PER_MEASURE
                          : PIXELS_PER_MEASURE,
                      ),
                    }}
                    onMouseDown={(e) => handleMouseDown(e, clip)}
                    title={clip.file.filename}
                  >
                    <span className="text-xs truncate">{clip.file.filename}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {tracks.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: TRACK_HEIGHT }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
