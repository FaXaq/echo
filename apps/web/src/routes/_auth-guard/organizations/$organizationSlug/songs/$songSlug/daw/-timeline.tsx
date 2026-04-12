import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  TRACK_HEIGHT,
  RULER_HEIGHT,
  MIN_MEASURES,
  BUFFER_MEASURES,
  LEFT_PANEL_WIDTH,
  ZOOM_LEVELS,
  zoomIn,
  zoomOut,
} from "./-constants";
import type { AudioClip } from "./-daw-types";
import { useDawContext } from "./-daw-context";
import { getAudioDurationMs } from "./-file-utils";
import { stripExtension } from "./-clip-utils";
import { DawRuler } from "./-daw-ruler";
import { DawStructureLane, DawStructureLaneHeader } from "./-daw-structure-lane";
import { DawTrackRow } from "./-daw-track-row";
import { DawBottomDropZone } from "./-daw-bottom-drop-zone";
import { DawDragGhostOverlay } from "./-daw-drag-ghost";
import { useClipDrag } from "./hooks/-use-clip-drag";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { SortableTrackHeader } from "./-sortable-track-header";
import { useFileDrop } from "./hooks/-use-file-drop";
import { useClipSelection } from "./hooks/-use-clip-selection";
import { useStructureLaneResize } from "./hooks/-use-structure-lane-resize";

export function Timeline() {
  const {
    song,
    bpm,
    tracks,
    clips,
    midiClips,
    playbackPosition,
    isPlaying,
    setEditingTrackId,
    setPendingMultiDrop,
    selection,
    setSelection,
    onClipPositionChanged,
    onMidiClipPositionChanged,
    onTrackDeleted,
    onClipUploaded,
    onMidiClipUploaded,
    onClipDeleted,
    onMidiClipDeleted,
    onClipRenamed,
    onTrackRenamed,
    onAddTrack,
    onTracksReordered,
    onBottomZoneDrop,
    pushHistory,
    pixelsPerMeasure,
    setPixelsPerMeasure,
  } = useDawContext();
  const organizationId = song.organizationId;

  // Section instances for the structure lane (read-only)
  const { data: sectionInstances } = trpc.organization.song.section.instance.list.useQuery({ songId: song.id });
  const structureInstances = sectionInstances ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const pendingStartMeasureRef = useRef<number>(1);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [previewTracks, setPreviewTracks] = useState<typeof tracks | null>(null);

  // Always-current selection ref — avoids stale closures in callbacks
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Zoom via Ctrl/Cmd + scroll wheel (non-passive so preventDefault works)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setPixelsPerMeasure((prev) => (e.deltaY < 0 ? zoomIn(prev) : zoomOut(prev)));
    };
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [setPixelsPerMeasure]);

  // tRPC mutations
  const deleteTrack = trpc.organization.track.delete.useMutation();
  const renameTrack = trpc.organization.track.rename.useMutation();
  const renameClip = trpc.organization.audioClip.rename.useMutation();
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const registerMidiClip = trpc.organization.midiClip.register.useMutation();
  const deleteClip = trpc.organization.audioClip.delete.useMutation();
  const deleteMidiClip = trpc.organization.midiClip.delete.useMutation();
  const deleteManyAudioClips = trpc.organization.audioClip.deleteMany.useMutation();
  const deleteManyMidiClips = trpc.organization.midiClip.deleteMany.useMutation();

  const secondsPerMeasure = (4 * 60) / bpm;

  // Upload handlers (consumed by useFileDrop and DawTrackRow)
  const handleUploadAudio = useCallback(
    async (trackId: string, file: File, startMeasure: number) => {
      const contentType = file.type || "audio/mpeg";
      const durationMs = await getAudioDurationMs(file);
      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
        organizationId,
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
      const clip = await registerClip.mutateAsync({
        trackId, filename: file.name, storageKey, organizationId, startMeasure, durationMs,
      });
      onClipUploaded(clip);
    },
    [getUploadUrl, registerClip, onClipUploaded, organizationId],
  );

  const handleUploadMidi = useCallback(
    async (trackId: string, file: File, startMeasure: number) => {
      const contentType = "audio/midi";
      let durationMs: number | undefined;
      try {
        const { Midi } = await import("@tonejs/midi");
        const midi = new Midi(await file.arrayBuffer());
        if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
      } catch { /* skip */ }
      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
        organizationId,
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
      const clip = await registerMidiClip.mutateAsync({
        trackId, filename: file.name, storageKey, organizationId, startMeasure, durationMs,
      });
      onMidiClipUploaded(clip);
    },
    [getUploadUrl, registerMidiClip, onMidiClipUploaded, organizationId],
  );

  // Track-level handlers
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

  const handleDeleteMidiClip = useCallback(
    (clipId: string) => {
      deleteMidiClip.mutate({ clipId }, { onSuccess: () => onMidiClipDeleted(clipId) });
    },
    [deleteMidiClip, onMidiClipDeleted],
  );

  const handleDeleteSelection = useCallback(() => {
    const currentSelection = selectionRef.current;
    const audioIds = Array.from(currentSelection.audioClipIds);
    const midiIds = Array.from(currentSelection.midiClipIds);
    if (audioIds.length === 0 && midiIds.length === 0) return;
    setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });
    const promises: Promise<unknown>[] = [];
    if (audioIds.length > 0) {
      promises.push(
        deleteManyAudioClips
          .mutateAsync({ clipIds: audioIds })
          .then(() => audioIds.forEach((id) => onClipDeleted(id))),
      );
    }
    if (midiIds.length > 0) {
      promises.push(
        deleteManyMidiClips
          .mutateAsync({ clipIds: midiIds })
          .then(() => midiIds.forEach((id) => onMidiClipDeleted(id))),
      );
    }
    Promise.allSettled(promises);
  }, [deleteManyAudioClips, deleteManyMidiClips, onClipDeleted, onMidiClipDeleted, setSelection]);

  // Interaction hooks
  const { selectionRect, handleTimelineMouseDown } = useClipSelection({
    containerRef,
    tracks,
    clips,
    midiClips,
    secondsPerMeasure,
    setSelection,
    onDeleteSelection: handleDeleteSelection,
  });

  const { handleMouseDown, handleMidiMouseDown } = useClipDrag({
    containerRef,
    tracks,
    clips,
    midiClips,
    selection,
    onClipPositionChanged,
    onMidiClipPositionChanged,
    pushHistory,
  });

  const { optimisticInstances, onResizeStart } = useStructureLaneResize({
    instances: structureInstances,
    scrollContainerRef: containerRef,
    songId: song.id,
  });


  const { isDragActive, dragGhost, bottomDropZone, handleDragEnter, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } =
    useFileDrop({
      containerRef,
      tracks,
      onPendingMultiDrop: setPendingMultiDrop,
      onBottomZoneDrop,
      handleUploadAudio,
      handleUploadMidi,
    });

  const handleRenameCommit = useCallback(
    (trackId: string, name: string, originalName: string) => {
      setEditingTrackId(null);
      const trimmed = name.trim();
      if (trimmed && trimmed !== originalName) {
        renameTrack.mutate(
          { trackId, name: trimmed },
          { onSuccess: (updated) => onTrackRenamed(updated.id, updated.name) },
        );
      }
    },
    [renameTrack, setEditingTrackId, onTrackRenamed],
  );

  const handleEditClipCommit = useCallback(
    (clip: AudioClip, name: string) => {
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
    },
    [renameClip, onClipRenamed],
  );

  const totalMeasures = useMemo(() => {
    const displayInstances = optimisticInstances ?? structureInstances;
    const lastAudioEnd = clips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    const lastMidiEnd = midiClips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    const lastSectionEnd = displayInstances.reduce((max, i) => {
      return Math.max(max, i.startMeasure - 1 + i.lengthMeasures);
    }, 0);
    return Math.max(MIN_MEASURES, Math.ceil(Math.max(lastAudioEnd, lastMidiEnd, lastSectionEnd)) + BUFFER_MEASURES);
  }, [clips, midiClips, secondsPerMeasure, optimisticInstances, structureInstances]);

  const totalWidth = totalMeasures * pixelsPerMeasure;

  return (
    <div className="border rounded-lg overflow-hidden flex flex-row">
      {/* Left panel — fixed, no horizontal scroll */}
      <div className="flex-shrink-0 border-r relative" style={{ width: LEFT_PANEL_WIDTH }}>
        <div className="bg-muted border-b" style={{ height: RULER_HEIGHT }} />

        <DawStructureLaneHeader visible={structureInstances.length > 0} />

        <DragDropProvider
          onDragOver={(event) => {
            setPreviewTracks(move(tracks, event));
          }}
          onDragEnd={(event) => {
            setPreviewTracks(null);
            if (event.canceled) return;
            const reordered = move(tracks, event);
            onTracksReordered(reordered);
            pushHistory?.(() => onTracksReordered(tracks));
          }}
        >
          {tracks.map((track, index) => (
            <SortableTrackHeader
              key={track.id}
              track={track}
              index={index}
              onDeleteTrack={handleDeleteTrack}
              onRenameCommit={handleRenameCommit}
            />
          ))}
        </DragDropProvider>

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
      <div
        className={cn("flex-1 overflow-x-auto min-w-0", isDragActive && "ring-2 ring-inset ring-primary/40")}
        ref={containerRef}
        onMouseDown={handleTimelineMouseDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <div className="relative" style={{ width: totalWidth }}>
          <DawRuler totalMeasures={totalMeasures} />

          <DawStructureLane
            instances={optimisticInstances ?? structureInstances}
            totalWidth={totalWidth}
            onResizeStart={onResizeStart}
          />

          {/* Track lanes — follow previewTracks order during drag */}
          {(previewTracks ?? tracks).map((track) => (
            <DawTrackRow
              key={track.id}
              track={track}
              totalMeasures={totalMeasures}
              secondsPerMeasure={secondsPerMeasure}
              editingClipId={editingClipId}
              pendingStartMeasureRef={pendingStartMeasureRef}
              onAudioMouseDown={handleMouseDown}
              onMidiMouseDown={handleMidiMouseDown}
              onEditClipStart={setEditingClipId}
              onEditClipCommit={handleEditClipCommit}
              onDeleteClip={handleDeleteClip}
              onDeleteMidiClip={handleDeleteMidiClip}
              onDeleteSelection={handleDeleteSelection}
              onUploadAudio={handleUploadAudio}
              onUploadMidi={handleUploadMidi}
            />
          ))}

          {tracks.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: TRACK_HEIGHT }}
            />
          )}

          <DawBottomDropZone visible={bottomDropZone} />

          {/* Ghost clip overlay during drag */}
          <DawDragGhostOverlay dragGhost={dragGhost} />

          {/* Playback cursor */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-px pointer-events-none z-10",
              isPlaying ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ left: playbackPosition * pixelsPerMeasure }}
          />

          {/* Selection rect overlay during drag-to-select */}
          {selectionRect && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-5"
              style={{
                left: Math.min(selectionRect.startX, selectionRect.currentX) - (containerRef.current?.getBoundingClientRect().left ?? 0) + (containerRef.current?.scrollLeft ?? 0),
                top: Math.min(selectionRect.startY, selectionRect.currentY) - (containerRef.current?.getBoundingClientRect().top ?? 0),
                width: Math.abs(selectionRect.currentX - selectionRect.startX),
                height: Math.abs(selectionRect.currentY - selectionRect.startY),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
