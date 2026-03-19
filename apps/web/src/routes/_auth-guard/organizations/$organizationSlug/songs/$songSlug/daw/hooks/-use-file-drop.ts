import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { TRACK_HEIGHT, RULER_HEIGHT } from "../-constants";
import type { Track, PendingMultiFileDrop } from "../-daw-types";
import {
  detectFileTypeFromItems,
  detectFileTypeFromFile,
  getAudioDurationMs,
} from "../-file-utils";
import { computeGhostPosition } from "../-clip-utils";

type DragGhost = {
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
  durationMs?: number;
  uploading?: boolean;
} | null;

interface UseFileDropDeps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tracks: Track[];
  onPendingMultiDrop?: (pending: Exclude<PendingMultiFileDrop, null>) => void;
  onBottomDropZoneChange?: (active: boolean) => void;
  onBottomZoneDrop?: (file: File, startMeasure: number) => Promise<void>;
  handleUploadAudio: (trackId: string, file: File, startMeasure: number) => Promise<void>;
  handleUploadMidi: (trackId: string, file: File, startMeasure: number) => Promise<void>;
}

export function useFileDrop({
  containerRef,
  tracks,
  onPendingMultiDrop,
  onBottomDropZoneChange,
  onBottomZoneDrop,
  handleUploadAudio,
  handleUploadMidi,
}: UseFileDropDeps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragGhost, setDragGhost] = useState<DragGhost>(null);
  const [bottomDropZone, setBottomDropZone] = useState(false);

  useEffect(() => {
    onBottomDropZoneChange?.(bottomDropZone);
  }, [bottomDropZone, onBottomDropZoneChange]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileType = detectFileTypeFromItems(e.dataTransfer.items);
    if (fileType) setIsDragActive(true);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const fileType = detectFileTypeFromItems(e.dataTransfer.items);
      if (!fileType) {
        setDragGhost(null);
        setBottomDropZone(false);
        return;
      }
      setIsDragActive(true);

      const rect = containerRef.current.getBoundingClientRect();
      const pixelY = e.clientY - rect.top;
      const lastTrackBottomY = RULER_HEIGHT + tracks.length * TRACK_HEIGHT;

      if (pixelY > lastTrackBottomY) {
        setBottomDropZone(true);
        setDragGhost(null);
      } else {
        setBottomDropZone(false);
        const pos = computeGhostPosition(e, containerRef.current, tracks);
        setDragGhost((prev) => (pos ? { ...prev, ...pos, fileType } : null));
      }
    },
    [tracks, containerRef],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.relatedTarget as Node)) {
        setDragGhost(null);
        setIsDragActive(false);
        setBottomDropZone(false);
      }
    },
    [containerRef],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      if (!containerRef.current || tracks.length === 0) {
        setDragGhost(null);
        setBottomDropZone(false);
        return;
      }
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) {
        setDragGhost(null);
        setBottomDropZone(false);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pixelY = e.clientY - rect.top;
      const isBottomZoneDrop = pixelY > RULER_HEIGHT + tracks.length * TRACK_HEIGHT;
      setBottomDropZone(false);

      if (files.length > 1) {
        if (isBottomZoneDrop) {
          files.forEach((file) => { onBottomZoneDrop?.(file, 1); });
          setDragGhost(null);
          return;
        }
        const pos = computeGhostPosition(e, containerRef.current, tracks);
        if (!pos) { setDragGhost(null); return; }
        onPendingMultiDrop?.({
          files,
          targetTrackIndex: pos.trackIndex,
          targetStartMeasure: pos.startMeasure,
        });
        setDragGhost(null);
        return;
      }

      const file = files[0];
      const fileType = detectFileTypeFromFile(file);
      if (!fileType) { setDragGhost(null); return; }
      const pos = computeGhostPosition(e, containerRef.current, tracks);

      if (!pos) {
        try {
          await onBottomZoneDrop?.(file, 1);
        } finally {
          setDragGhost(null);
        }
        return;
      }

      if (!tracks[pos.trackIndex]) { setDragGhost(null); return; }

      let durationMs: number | undefined;
      if (fileType === "audio") {
        durationMs = await getAudioDurationMs(file);
      } else {
        try {
          const { Midi } = await import("@tonejs/midi");
          const midi = new Midi(await file.arrayBuffer());
          if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
        } catch { /* leave undefined */ }
      }

      setDragGhost({ ...pos, fileType, durationMs, uploading: true });

      try {
        const trackId = tracks[pos.trackIndex].id;
        if (fileType === "audio") {
          await handleUploadAudio(trackId, file, pos.startMeasure);
        } else {
          await handleUploadMidi(trackId, file, pos.startMeasure);
        }
      } finally {
        setDragGhost(null);
      }
    },
    [tracks, handleUploadAudio, handleUploadMidi, onBottomZoneDrop, onPendingMultiDrop, containerRef],
  );

  const handleDragEnd = useCallback(() => {
    setDragGhost(null);
    setIsDragActive(false);
  }, []);

  return { isDragActive, dragGhost, bottomDropZone, handleDragEnter, handleDragOver, handleDragLeave, handleDrop, handleDragEnd };
}
