import { useRef, useCallback } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import {
  TRACK_HEIGHT,
  RULER_HEIGHT,
  SCROLL_THRESHOLD,
  SCROLL_MAX_SPEED,
} from "../-constants";
import type { Track, AudioClip, MidiClip, ClipSelection } from "../-daw-types";
import { computeSnappedMeasure } from "../-clip-utils";
import { useDawContext } from "../-daw-context";

// ── Private helpers ─────────────────────────────────────────────────────────

function buildCoMovers(
  isSelected: boolean,
  selectedIds: Set<string>,
  currentId: string,
  clipType: "audio" | "midi",
  allClips: Array<{ id: string; trackId: string; startMeasure: number }>,
  tracks: Track[],
): DraggingState["coMovers"] {
  if (!isSelected) return [];
  return Array.from(selectedIds)
    .filter((id) => id !== currentId)
    .map((id) => {
      const coClip = allClips.find((c) => c.id === id);
      return coClip
        ? {
          clipId: coClip.id,
          clipType,
          originTrackIndex: tracks.findIndex((t) => t.id === coClip.trackId),
          originStartMeasure: coClip.startMeasure,
        }
        : null;
    })
    .filter((c) => c !== null) as DraggingState["coMovers"];
}

type PositionMutator = {
  mutate: (
    input: { clipId: string; startMeasure: number },
    opts?: { onSuccess?: () => void; onError?: (err: unknown) => void },
  ) => void;
};

function commitCoMoverPositions(
  coMovers: DraggingState["coMovers"],
  deltaMeasures: number,
  updateAudio: PositionMutator,
  updateMidi: PositionMutator,
  pushHistory?: (fn: () => void) => void,
): void {
  Promise.allSettled(
    coMovers.map((coMover) => {
      const newStartMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
      const update = coMover.clipType === "audio" ? updateAudio : updateMidi;
      return new Promise<void>((resolve, reject) => {
        update.mutate(
          { clipId: coMover.clipId, startMeasure: newStartMeasure },
          { onSuccess: () => resolve(), onError: (err) => reject(err) },
        );
      });
    }),
  ).then((results) => {
    if (results.every((r) => r.status === "fulfilled")) {
      pushHistory?.(() => {
        coMovers.forEach((coMover) => {
          const update = coMover.clipType === "audio" ? updateAudio : updateMidi;
          update.mutate({ clipId: coMover.clipId, startMeasure: coMover.originStartMeasure });
        });
      });
    }
  });
}

// ── Hook ────────────────────────────────────────────────────────────────────

interface UseClipDragDeps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  selection: ClipSelection;
  onClipPositionChanged: (clip: AudioClip) => void;
  onMidiClipPositionChanged: (clip: MidiClip) => void;
  pushHistory?: (apiUndo: () => void) => void;
}

type DraggingState = {
  clipId: string;
  startX: number;
  startY: number;
  initialScrollLeft: number;
  originalMeasure: number;
  originalTrackIndex: number;
  lock: "horizontal" | "vertical" | null;
  currentTrackIndex: number;
  coMovers: Array<{
    clipId: string;
    clipType: "audio" | "midi";
    originTrackIndex: number;
    originStartMeasure: number;
  }>;
};

export function useClipDrag({
  containerRef,
  tracks,
  clips,
  midiClips,
  selection,
  onClipPositionChanged,
  onMidiClipPositionChanged,
  pushHistory,
}: UseClipDragDeps) {
  const { pixelsPerMeasure } = useDawContext();
  const draggingAudioRef = useRef<DraggingState | null>(null);
  const draggingMidiRef = useRef<DraggingState | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);
  const currentMouseXRef = useRef<number>(0);

  const updateAudioPosition = trpc.organization.audioClip.updatePosition.useMutation();
  const updateMidiPosition = trpc.organization.midiClip.updatePosition.useMutation();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clip: AudioClip) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (!containerRef.current) return;

      const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
      if (trackIndex === -1) return;

      const isClipSelected = selection.audioClipIds.has(clip.id);
      const coMovers = buildCoMovers(isClipSelected, selection.audioClipIds, clip.id, "audio", clips, tracks);

      draggingAudioRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        startY: e.clientY,
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
        originalTrackIndex: trackIndex,
        lock: isClipSelected ? "horizontal" : null,
        currentTrackIndex: trackIndex,
        coMovers,
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      let lastCallbackMeasure = clip.startMeasure;
      let lastCallbackTrackId = clip.trackId;

      const computeMeasure = (mouseX: number, scrollLeft: number) =>
        computeSnappedMeasure(mouseX, scrollLeft, draggingAudioRef.current!.startX, draggingAudioRef.current!.initialScrollLeft, draggingAudioRef.current!.originalMeasure, pixelsPerMeasure);

      const animate = () => {
        if (draggingAudioRef.current && containerRef.current && scrollSpeedRef.current !== 0) {
          containerRef.current.scrollLeft = Math.max(0, containerRef.current.scrollLeft + scrollSpeedRef.current);
          const snapped = computeMeasure(currentMouseXRef.current, containerRef.current.scrollLeft);
          if (snapped !== lastCallbackMeasure) {
            lastCallbackMeasure = snapped;
            onClipPositionChanged({ ...clip, startMeasure: snapped });
          }
        }
        scrollAnimRef.current = requestAnimationFrame(animate);
      };
      scrollAnimRef.current = requestAnimationFrame(animate);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingAudioRef.current || !containerRef.current) return;
        currentMouseXRef.current = moveEvent.clientX;
        const rect = containerRef.current.getBoundingClientRect();
        const distLeft = moveEvent.clientX - rect.left;
        const distRight = rect.right - moveEvent.clientX;
        if (distLeft < SCROLL_THRESHOLD) {
          scrollSpeedRef.current = -SCROLL_MAX_SPEED * (1 - distLeft / SCROLL_THRESHOLD);
        } else if (distRight < SCROLL_THRESHOLD) {
          scrollSpeedRef.current = SCROLL_MAX_SPEED * (1 - distRight / SCROLL_THRESHOLD);
        } else {
          scrollSpeedRef.current = 0;
        }

        if (draggingAudioRef.current.lock === null) {
          const dx = Math.abs(moveEvent.clientX - draggingAudioRef.current.startX);
          const dy = Math.abs(moveEvent.clientY - draggingAudioRef.current.startY);
          if (dx > 5 && dx > dy) draggingAudioRef.current.lock = "horizontal";
          else if (dy > 5 && dy > dx) draggingAudioRef.current.lock = "vertical";
        }

        if (draggingAudioRef.current.lock === "vertical") {
          const trackPixelY = moveEvent.clientY - rect.top - RULER_HEIGHT;
          draggingAudioRef.current.currentTrackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT)));
        } else {
          draggingAudioRef.current.currentTrackIndex = draggingAudioRef.current.originalTrackIndex;
        }

        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        const targetTrackId = tracks[draggingAudioRef.current.currentTrackIndex]?.id ?? clip.trackId;

        if (snapped !== lastCallbackMeasure || targetTrackId !== lastCallbackTrackId) {
          lastCallbackMeasure = snapped;
          lastCallbackTrackId = targetTrackId;
          onClipPositionChanged({ ...clip, startMeasure: snapped, trackId: targetTrackId });

          const deltaMeasures = snapped - draggingAudioRef.current.originalMeasure;
          draggingAudioRef.current.coMovers.forEach((coMover) => {
            const coMoverNewMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            const coMoverTrackId = tracks[coMover.originTrackIndex]?.id;
            if (coMoverTrackId) {
              if (coMover.clipType === "audio") {
                const coClip = clips.find((c) => c.id === coMover.clipId);
                if (coClip) onClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
              } else {
                const coClip = midiClips.find((c) => c.id === coMover.clipId);
                if (coClip) onMidiClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
              }
            }
          });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingAudioRef.current || !containerRef.current) return;
        scrollSpeedRef.current = 0;
        if (scrollAnimRef.current !== null) {
          cancelAnimationFrame(scrollAnimRef.current);
          scrollAnimRef.current = null;
        }
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);
        const dragState = draggingAudioRef.current;
        const newTrackId = tracks[dragState.currentTrackIndex]?.id;
        const movedToNewTrack =
          dragState.lock === "vertical" &&
          dragState.currentTrackIndex !== dragState.originalTrackIndex &&
          newTrackId;

        if (dragState.coMovers.length > 0 && dragState.lock === "horizontal") {
          commitCoMoverPositions(dragState.coMovers, snapped - dragState.originalMeasure, updateAudioPosition, updateMidiPosition, pushHistory);
        }

        updateAudioPosition.mutate(
          { clipId: clip.id, startMeasure: snapped, ...(movedToNewTrack && { trackId: newTrackId }) },
          {
            onSuccess: (updated) => {
              if (movedToNewTrack) {
                pushHistory?.(() => {
                  updateAudioPosition.mutate({ clipId: clip.id, startMeasure: snapped, trackId: clip.trackId });
                });
              }
              onClipPositionChanged(updated);
            },
            onError: () => {
              onClipPositionChanged({
                ...clip,
                startMeasure: dragState.originalMeasure,
                trackId: tracks[dragState.originalTrackIndex]?.id ?? clip.trackId,
              });
            },
          },
        );
        draggingAudioRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onClipPositionChanged, onMidiClipPositionChanged, updateAudioPosition, updateMidiPosition, tracks, clips, midiClips, pushHistory, selection, containerRef, pixelsPerMeasure],
  );

  const handleMidiMouseDown = useCallback(
    (e: React.MouseEvent, clip: MidiClip) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (!containerRef.current) return;

      const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
      if (trackIndex === -1) return;

      const isClipSelected = selection.midiClipIds.has(clip.id);
      const coMovers = buildCoMovers(isClipSelected, selection.midiClipIds, clip.id, "midi", midiClips, tracks);

      draggingMidiRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        startY: e.clientY,
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
        originalTrackIndex: trackIndex,
        lock: isClipSelected ? "horizontal" : null,
        currentTrackIndex: trackIndex,
        coMovers,
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      let lastCallbackMeasure = clip.startMeasure;
      let lastCallbackTrackId = clip.trackId;

      const computeMeasure = (mouseX: number, scrollLeft: number) =>
        computeSnappedMeasure(mouseX, scrollLeft, draggingMidiRef.current!.startX, draggingMidiRef.current!.initialScrollLeft, draggingMidiRef.current!.originalMeasure, pixelsPerMeasure);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingMidiRef.current || !containerRef.current) return;
        currentMouseXRef.current = moveEvent.clientX;

        if (draggingMidiRef.current.lock === null) {
          const dx = Math.abs(moveEvent.clientX - draggingMidiRef.current.startX);
          const dy = Math.abs(moveEvent.clientY - draggingMidiRef.current.startY);
          if (dx > 5 && dx > dy) draggingMidiRef.current.lock = "horizontal";
          else if (dy > 5 && dy > dx) draggingMidiRef.current.lock = "vertical";
        }

        if (draggingMidiRef.current.lock === "vertical") {
          const rect = containerRef.current.getBoundingClientRect();
          const trackPixelY = moveEvent.clientY - rect.top - RULER_HEIGHT;
          draggingMidiRef.current.currentTrackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT)));
        } else {
          draggingMidiRef.current.currentTrackIndex = draggingMidiRef.current.originalTrackIndex;
        }

        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        const targetTrackId = tracks[draggingMidiRef.current.currentTrackIndex]?.id ?? clip.trackId;

        if (snapped !== lastCallbackMeasure || targetTrackId !== lastCallbackTrackId) {
          lastCallbackMeasure = snapped;
          lastCallbackTrackId = targetTrackId;
          onMidiClipPositionChanged({ ...clip, startMeasure: snapped, trackId: targetTrackId });

          const deltaMeasures = snapped - draggingMidiRef.current.originalMeasure;
          draggingMidiRef.current.coMovers.forEach((coMover) => {
            const coMoverNewMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            const coMoverTrackId = tracks[coMover.originTrackIndex]?.id;
            if (coMoverTrackId) {
              if (coMover.clipType === "audio") {
                const coClip = clips.find((c) => c.id === coMover.clipId);
                if (coClip) onClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
              } else {
                const coClip = midiClips.find((c) => c.id === coMover.clipId);
                if (coClip) onMidiClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
              }
            }
          });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingMidiRef.current || !containerRef.current) return;
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);
        const dragState = draggingMidiRef.current;
        const newTrackId = tracks[dragState.currentTrackIndex]?.id;
        const movedToNewTrack =
          dragState.lock === "vertical" &&
          dragState.currentTrackIndex !== dragState.originalTrackIndex &&
          newTrackId;

        if (dragState.coMovers.length > 0 && dragState.lock === "horizontal") {
          commitCoMoverPositions(dragState.coMovers, snapped - dragState.originalMeasure, updateAudioPosition, updateMidiPosition, pushHistory);
        }

        updateMidiPosition.mutate(
          { clipId: clip.id, startMeasure: snapped, ...(movedToNewTrack && { trackId: newTrackId }) },
          {
            onSuccess: (updated) => {
              if (movedToNewTrack) {
                pushHistory?.(() => {
                  updateMidiPosition.mutate({ clipId: clip.id, startMeasure: snapped, trackId: clip.trackId });
                });
              }
              onMidiClipPositionChanged(updated);
            },
            onError: () => {
              onMidiClipPositionChanged({
                ...clip,
                startMeasure: dragState.originalMeasure,
                trackId: tracks[dragState.originalTrackIndex]?.id ?? clip.trackId,
              });
            },
          },
        );
        draggingMidiRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onMidiClipPositionChanged, onClipPositionChanged, updateMidiPosition, updateAudioPosition, tracks, clips, midiClips, pushHistory, selection, containerRef, pixelsPerMeasure],
  );

  return { handleMouseDown, handleMidiMouseDown };
}
