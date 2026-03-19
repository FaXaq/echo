import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { PIXELS_PER_MEASURE, TRACK_HEIGHT, RULER_HEIGHT } from "../-constants";
import type { Track, AudioClip, MidiClip, ClipSelection, SelectionRect } from "../-daw-types";

interface UseClipSelectionDeps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  secondsPerMeasure: number;
}

export function useClipSelection({
  containerRef,
  tracks,
  clips,
  midiClips,
  secondsPerMeasure,
}: UseClipSelectionDeps) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect>(null);
  const [selection, setSelection] = useState<ClipSelection>({
    audioClipIds: new Set(),
    midiClipIds: new Set(),
  });

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-clip]")) return;

      setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });

      let currentSelectionRect = {
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      };
      setSelectionRect(currentSelectionRect);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        currentSelectionRect = {
          ...currentSelectionRect,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
        };
        setSelectionRect(currentSelectionRect);
      };

      const handleMouseUp = () => {
        if (!containerRef.current) {
          setSelectionRect(null);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;

        const selLeft = Math.min(currentSelectionRect.startX, currentSelectionRect.currentX) - rect.left + scrollLeft;
        const selRight = Math.max(currentSelectionRect.startX, currentSelectionRect.currentX) - rect.left + scrollLeft;
        const selTop = Math.min(currentSelectionRect.startY, currentSelectionRect.currentY) - rect.top;
        const selBottom = Math.max(currentSelectionRect.startY, currentSelectionRect.currentY) - rect.top;

        const audioClipIds = new Set<string>();
        const midiClipIds = new Set<string>();

        clips.forEach((clip) => {
          const clipLeft = (clip.startMeasure - 1) * PIXELS_PER_MEASURE;
          const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
          const clipRight = clipLeft + durationMeasures * PIXELS_PER_MEASURE;
          const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
          const clipTop = RULER_HEIGHT + trackIndex * TRACK_HEIGHT;
          const clipBottom = clipTop + TRACK_HEIGHT;
          if (clipLeft < selRight && clipRight > selLeft && clipTop < selBottom && clipBottom > selTop) {
            audioClipIds.add(clip.id);
          }
        });

        midiClips.forEach((clip) => {
          const clipLeft = (clip.startMeasure - 1) * PIXELS_PER_MEASURE;
          const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
          const clipRight = clipLeft + durationMeasures * PIXELS_PER_MEASURE;
          const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
          const clipTop = RULER_HEIGHT + trackIndex * TRACK_HEIGHT;
          const clipBottom = clipTop + TRACK_HEIGHT;
          if (clipLeft < selRight && clipRight > selLeft && clipTop < selBottom && clipBottom > selTop) {
            midiClipIds.add(clip.id);
          }
        });

        setSelection({ audioClipIds, midiClipIds });
        setSelectionRect(null);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [clips, midiClips, tracks, secondsPerMeasure, containerRef],
  );

  // Clear selection on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });
        setSelectionRect(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { selection, setSelection, selectionRect, handleTimelineMouseDown };
}
