import { useState, useCallback, useEffect } from "react";
import type React from "react";
import type { Track, AudioClip, MidiClip, HistoryEntry } from "../-daw-types";

interface UseDawHistoryDeps {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  setMidiClips: React.Dispatch<React.SetStateAction<MidiClip[]>>;
}

export function useDawHistory({
  tracks,
  clips,
  midiClips,
  setTracks,
  setClips,
  setMidiClips,
}: UseDawHistoryDeps) {
  const [, setHistory] = useState<HistoryEntry[]>([]);
  const [, setFuture] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback(
    (apiUndo: () => void) => {
      setHistory((h) => {
        const newHistory = [...h, { tracks, clips, midiClips, apiUndo }];
        return newHistory.slice(-50);
      });
      setFuture([]);
    },
    [tracks, clips, midiClips],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const entry = h[h.length - 1];
      setFuture((f) => [...f, { tracks, clips, midiClips, apiUndo: () => { } }]);
      setTracks(entry.tracks);
      setClips(entry.clips);
      setMidiClips(entry.midiClips);
      entry.apiUndo();
      return h.slice(0, -1);
    });
  }, [tracks, clips, midiClips, setTracks, setClips, setMidiClips]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const entry = f[0];
      setHistory((h) => {
        const newHistory = [...h, { tracks, clips, midiClips, apiUndo: () => { } }];
        return newHistory.slice(-50);
      });
      setTracks(entry.tracks);
      setClips(entry.clips);
      setMidiClips(entry.midiClips);
      return f.slice(1);
    });
  }, [tracks, clips, midiClips, setTracks, setClips, setMidiClips]);

  // Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z / Ctrl+Y (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.metaKey && e.shiftKey && e.key === "z") ||
          (e.ctrlKey && e.shiftKey && e.key === "z") ||
          (e.ctrlKey && e.key === "y")) &&
        !e.altKey
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return { pushHistory, undo, redo };
}
