import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Slider } from "@/ui/slider";
import { PhantomInput } from "@/ui/phantom-input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];

const PIXELS_PER_MEASURE = 120;
const TRACK_HEIGHT = 48;
const RULER_HEIGHT = 32;
const MIN_MEASURES = 32;
const BUFFER_MEASURES = 8;
const LEFT_PANEL_WIDTH = 200;
const SCROLL_THRESHOLD = 80; // px from container edge to start auto-scrolling
const SCROLL_MAX_SPEED = 14; // px per animation frame

function getAudioDurationMs(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(
        Number.isFinite(audio.duration)
          ? Math.round(audio.duration * 1000)
          : undefined,
      );
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    audio.src = url;
  });
}

interface TimelineProps {
  tracks: Track[];
  clips: AudioClip[];
  bpm: number;
  playbackPosition: number;
  isPlaying: boolean;
  organizationId: string;
  editingTrackId: string | null;
  downloadUrls: Map<string, string>;
  onClipPositionChanged: (clip: AudioClip) => void;
  onVolumeChanged: (trackId: string, volume: number) => void;
  onTrackDeleted: (trackId: string) => void;
  onClipUploaded: (clip: AudioClip) => void;
  onClipDeleted: (clipId: string) => void;
  onClipRenamed: (clipId: string, name: string) => void;
  onEditingTrackIdChange: (id: string | null) => void;
  onTrackRenamed: (trackId: string, name: string) => void;
  onAddTrack: () => void;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function Timeline({
  tracks,
  clips,
  bpm,
  playbackPosition,
  isPlaying,
  organizationId,
  editingTrackId,
  downloadUrls,
  onClipPositionChanged,
  onVolumeChanged,
  onTrackDeleted,
  onClipUploaded,
  onClipDeleted,
  onClipRenamed,
  onEditingTrackIdChange,
  onTrackRenamed,
  onAddTrack,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingStartMeasureRef = useRef<number>(1);
  const draggingRef = useRef<{
    clipId: string;
    startX: number;
    initialScrollLeft: number;
    originalMeasure: number;
  } | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);
  const currentMouseXRef = useRef<number>(0);
  // One hidden file input ref per track, keyed by track id
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  const updatePosition = trpc.organization.audioClip.updatePosition.useMutation();
  const deleteTrack = trpc.organization.track.delete.useMutation();
  const renameTrack = trpc.organization.track.rename.useMutation();
  const renameClip = trpc.organization.audioClip.rename.useMutation();
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const deleteClip = trpc.organization.audioClip.delete.useMutation();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clip: AudioClip) => {
      e.preventDefault();
      if (!containerRef.current) return;

      draggingRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      const computeMeasure = (mouseX: number, scrollLeft: number) => {
        const dx =
          mouseX -
          draggingRef.current!.startX +
          scrollLeft -
          draggingRef.current!.initialScrollLeft;
        const newMeasure = Math.max(
          1,
          draggingRef.current!.originalMeasure + dx / PIXELS_PER_MEASURE,
        );
        return Math.round(newMeasure * 4) / 4;
      };

      // RAF loop: auto-scroll and update clip position while mouse is held near an edge
      const animate = () => {
        if (draggingRef.current && containerRef.current && scrollSpeedRef.current !== 0) {
          containerRef.current.scrollLeft = Math.max(
            0,
            containerRef.current.scrollLeft + scrollSpeedRef.current,
          );
          const snapped = computeMeasure(
            currentMouseXRef.current,
            containerRef.current.scrollLeft,
          );
          onClipPositionChanged({ ...clip, startMeasure: snapped });
        }
        scrollAnimRef.current = requestAnimationFrame(animate);
      };
      scrollAnimRef.current = requestAnimationFrame(animate);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;

        currentMouseXRef.current = moveEvent.clientX;

        // Update auto-scroll speed based on proximity to container edges
        const rect = containerRef.current.getBoundingClientRect();
        const distLeft = moveEvent.clientX - rect.left;
        const distRight = rect.right - moveEvent.clientX;
        if (distLeft < SCROLL_THRESHOLD) {
          scrollSpeedRef.current =
            -SCROLL_MAX_SPEED * (1 - distLeft / SCROLL_THRESHOLD);
        } else if (distRight < SCROLL_THRESHOLD) {
          scrollSpeedRef.current =
            SCROLL_MAX_SPEED * (1 - distRight / SCROLL_THRESHOLD);
        } else {
          scrollSpeedRef.current = 0;
        }

        const snapped = computeMeasure(
          moveEvent.clientX,
          containerRef.current.scrollLeft,
        );
        onClipPositionChanged({ ...clip, startMeasure: snapped });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) return;

        scrollSpeedRef.current = 0;
        if (scrollAnimRef.current !== null) {
          cancelAnimationFrame(scrollAnimRef.current);
          scrollAnimRef.current = null;
        }

        const snapped = computeMeasure(
          upEvent.clientX,
          containerRef.current.scrollLeft,
        );

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

  const handleUploadAudio = useCallback(
    async (trackId: string, file: File, startMeasure: number) => {
      const contentType = file.type || "audio/mpeg";
      const durationMs = await getAudioDurationMs(file);

      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
        organizationId,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      const clip = await registerClip.mutateAsync({
        trackId,
        filename: file.name,
        storageKey,
        organizationId,
        startMeasure,
        durationMs,
      });

      onClipUploaded(clip);
    },
    [getUploadUrl, registerClip, onClipUploaded, organizationId],
  );

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      deleteTrack.mutate({ trackId }, { onSuccess: () => onTrackDeleted(trackId) });
    },
    [deleteTrack, onTrackDeleted],
  );

  const handleDeleteClip = useCallback(
    (clipId: string) => {
      deleteClip.mutate({ clipId }, { onSuccess: () => onClipDeleted(clipId) });
    },
    [deleteClip, onClipDeleted],
  );

  const handleRenameCommit = useCallback(
    (trackId: string, name: string, originalName: string) => {
      onEditingTrackIdChange(null);
      const trimmed = name.trim();
      if (trimmed && trimmed !== originalName) {
        renameTrack.mutate(
          { trackId, name: trimmed },
          { onSuccess: (updated) => onTrackRenamed(updated.id, updated.name) },
        );
      }
    },
    [renameTrack, onEditingTrackIdChange, onTrackRenamed],
  );

  const secondsPerMeasure = (4 * 60) / bpm;

  const totalMeasures = useMemo(() => {
    const lastClipEnd = clips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs
        ? clip.durationMs / 1000 / secondsPerMeasure
        : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    return Math.max(MIN_MEASURES, Math.ceil(lastClipEnd) + BUFFER_MEASURES);
  }, [clips, secondsPerMeasure]);

  const totalWidth = totalMeasures * PIXELS_PER_MEASURE;

  return (
    <div className="border rounded-lg overflow-hidden flex flex-row">
      {/* Left panel — fixed, no horizontal scroll */}
      <div className="flex-shrink-0 border-r" style={{ width: LEFT_PANEL_WIDTH }}>
        <div className="bg-muted border-b" style={{ height: RULER_HEIGHT }} />

        {tracks.map((track) => (
          <ContextMenu key={track.id}>
            <ContextMenuTrigger asChild>
              <div
                className="border-b px-2 flex flex-col justify-center gap-0.5"
                style={{ height: TRACK_HEIGHT }}
              >
                <PhantomInput
                  defaultValue={track.name}
                  autoFocus={editingTrackId === track.id}
                  onFocus={() => onEditingTrackIdChange(track.id)}
                  onBlur={(e) => {
                    onEditingTrackIdChange(null);
                    handleRenameCommit(track.id, e.target.value, track.name);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") e.currentTarget.blur();
                  }}
                />
                <Slider
                  min={0}
                  max={100}
                  value={[track.volume]}
                  onValueChange={([v]) => onVolumeChanged(track.id, v)}
                  className="w-full [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:rounded-sm"
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => handleDeleteTrack(track.id)}
              >
                Delete track
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Add-track placeholder */}
        <div
          className="flex items-center justify-center border-b border-dashed cursor-pointer hover:border-primary hover:text-primary text-muted-foreground transition-colors"
          style={{ height: TRACK_HEIGHT }}
          onClick={onAddTrack}
        >
          <span className="text-lg leading-none select-none">+</span>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-x-auto min-w-0" ref={containerRef}>
        <div className="relative" style={{ width: totalWidth }}>
          {/* Ruler */}
          <div
            className="flex bg-muted border-b"
            style={{ height: RULER_HEIGHT }}
          >
            {Array.from({ length: totalMeasures }, (_, i) => (
              <div
                key={i}
                className="relative border-r border-border flex items-center px-1 shrink-0"
                style={{ width: PIXELS_PER_MEASURE }}
              >
                <span className="text-xs text-muted-foreground">{i + 1}</span>
                {[1, 2, 3].map((q) => (
                  <div
                    key={q}
                    className="absolute top-0 bottom-0 border-r border-border/20"
                    style={{ left: q * (PIXELS_PER_MEASURE / 4) }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Track lanes */}
          {tracks.map((track) => {
            const trackClips = clips.filter((c) => c.trackId === track.id);
            return (
              <ContextMenu key={track.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className="relative border-b bg-background"
                    style={{ height: TRACK_HEIGHT }}
                    onContextMenu={(e) => {
                      if (!containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      const pixelX =
                        e.clientX - rect.left + containerRef.current.scrollLeft;
                      pendingStartMeasureRef.current = Math.max(
                        1,
                        Math.min(
                          totalMeasures,
                          Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4 + 1,
                        ),
                      );
                    }}
                  >
                    {/* Grid lines — quarter subdivisions + measure boundaries */}
                    {Array.from({ length: totalMeasures * 4 }, (_, i) => {
                      const isMeasure = (i + 1) % 4 === 0;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "absolute top-0 bottom-0 border-r",
                            isMeasure ? "border-border/30" : "border-border/10",
                          )}
                          style={{
                            left: ((i + 1) * PIXELS_PER_MEASURE) / 4,
                          }}
                        />
                      );
                    })}

                    {/* Clips */}
                    {trackClips.map((clip) => (
                      <AudioClipView
                        key={clip.id}
                        clip={clip}
                        isEditing={editingClipId === clip.id}
                        downloadUrl={downloadUrls.get(clip.file.storageKey)}
                        secondsPerMeasure={secondsPerMeasure}
                        onMouseDown={handleMouseDown}
                        onEditStart={() => setEditingClipId(clip.id)}
                        onEditCommit={(name) => {
                          setEditingClipId(null);
                          const trimmed = name.trim();
                          const current = clip.name ?? stripExtension(clip.file.filename);
                          if (trimmed && trimmed !== current) {
                            renameClip.mutate(
                              { clipId: clip.id, name: trimmed },
                              {
                                onSuccess: (updated) =>
                                  onClipRenamed(updated.id, updated.name ?? stripExtension(updated.file.filename)),
                              },
                            );
                          }
                        }}
                        onDelete={() => handleDeleteClip(clip.id)}
                      />
                    ))}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={() => fileInputRefs.current.get(track.id)?.click()}
                  >
                    Upload audio
                  </ContextMenuItem>
                </ContextMenuContent>
                {/* Hidden file input per track */}
                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(track.id, el);
                    else fileInputRefs.current.delete(track.id);
                  }}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleUploadAudio(
                        track.id,
                        file,
                        pendingStartMeasureRef.current,
                      );
                    e.target.value = "";
                  }}
                />
              </ContextMenu>
            );
          })}

          {tracks.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: TRACK_HEIGHT }}
            />
          )}

          {/* Playback cursor */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-px pointer-events-none z-10",
              isPlaying ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ left: playbackPosition * PIXELS_PER_MEASURE }}
          />
        </div>
      </div>
    </div>
  );
}

interface AudioClipViewProps {
  clip: AudioClip;
  isEditing: boolean;
  downloadUrl: string | undefined;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: AudioClip) => void;
  onEditStart: () => void;
  onEditCommit: (name: string) => void;
  onDelete: () => void;
}

function AudioClipView({
  clip,
  isEditing,
  downloadUrl,
  secondsPerMeasure,
  onMouseDown,
  onEditStart,
  onEditCommit,
  onDelete,
}: AudioClipViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayName = clip.name ?? stripExtension(clip.file.filename);
  const clipWidth = Math.max(
    PIXELS_PER_MEASURE,
    clip.durationMs
      ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE
      : PIXELS_PER_MEASURE,
  );

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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="absolute top-1 bottom-1 rounded bg-primary/20 border border-primary/40 cursor-grab active:cursor-grabbing overflow-hidden select-none"
          style={{
            left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
            width: clipWidth,
          }}
          onMouseDown={(e) => onMouseDown(e, clip)}
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
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          Delete clip
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
