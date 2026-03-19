import { useState, useCallback } from "react";
import type React from "react";
import { TRACK_HEIGHT, RULER_HEIGHT } from "../-constants";
import type { Track } from "../-daw-types";

interface UseTrackHeaderDragDeps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tracks: Track[];
  onTracksReordered?: (reorderedTracks: Track[]) => void;
  pushHistory?: (apiUndo: () => void) => void;
}

type TrackHeaderDragState = {
  sourceIndex: number;
  startY: number;
  currentY: number;
  insertBeforeIndex: number | null;
} | null;

export function useTrackHeaderDrag({
  containerRef,
  tracks,
  onTracksReordered,
  pushHistory,
}: UseTrackHeaderDragDeps) {
  const [trackHeaderDragState, setTrackHeaderDragState] = useState<TrackHeaderDragState>(null);

  const handleTrackHeaderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, sourceIndex: number) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-drag-handle]")) return;

      e.preventDefault();
      setTrackHeaderDragState({
        sourceIndex,
        startY: e.clientY,
        currentY: e.clientY,
        insertBeforeIndex: sourceIndex,
      });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setTrackHeaderDragState((prev) => {
          if (!prev) return null;
          const trackPixelY =
            moveEvent.clientY - (containerRef.current?.getBoundingClientRect().top ?? 0) - RULER_HEIGHT;
          const hoverTrackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT)));
          return { ...prev, currentY: moveEvent.clientY, insertBeforeIndex: hoverTrackIndex };
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        setTrackHeaderDragState((prev) => {
          if (!prev || prev.insertBeforeIndex === null) return null;

          if (prev.insertBeforeIndex !== prev.sourceIndex) {
            const newTracks = [...tracks];
            const [movedTrack] = newTracks.splice(prev.sourceIndex, 1);
            newTracks.splice(prev.insertBeforeIndex, 0, movedTrack);

            onTracksReordered?.(newTracks);

            const { sourceIndex, insertBeforeIndex } = prev;
            pushHistory?.(() => {
              const undoTracks = [...newTracks];
              const [undoMovedTrack] = undoTracks.splice(insertBeforeIndex, 1);
              undoTracks.splice(sourceIndex, 0, undoMovedTrack);
              onTracksReordered?.(undoTracks);
            });
          }

          return null;
        });
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [tracks, onTracksReordered, pushHistory, containerRef],
  );

  return { trackHeaderDragState, handleTrackHeaderMouseDown };
}
