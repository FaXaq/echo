import { createContext, useContext } from "react";
import type React from "react";
import type {
  Song,
  Track,
  AudioClip,
  MidiClip,
  PendingMultiFileDrop,
} from "./-daw-types";

// ============================================================================
// Context value shape
// ============================================================================

export interface DawContextValue {
  // Static config
  song: Song;
  bpm: number;

  // Mutable data state (read from context, mutated via callbacks)
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  downloadUrls: Map<string, string>;

  // Playback state
  isPlaying: boolean;
  isExporting: boolean;
  playbackPosition: number;

  // Editing state
  editingTrackId: string | null;
  setEditingTrackId: (id: string | null) => void;

  // State setters (used by hooks wired into the provider)
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  setMidiClips: React.Dispatch<React.SetStateAction<MidiClip[]>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackPosition: React.Dispatch<React.SetStateAction<number>>;

  // Multi-file drop
  pendingMultiDrop: PendingMultiFileDrop;
  setPendingMultiDrop: React.Dispatch<React.SetStateAction<PendingMultiFileDrop>>;

  // Domain callbacks (stable references set by hooks in DawProvider)
  onTrackDeleted: (trackId: string) => void;
  onVolumeChanged: (trackId: string, volume: number) => void;
  onClipUploaded: (clip: AudioClip) => void;
  onMidiClipUploaded: (clip: MidiClip) => void;
  onClipPositionChanged: (clip: AudioClip) => void;
  onMidiClipPositionChanged: (clip: MidiClip) => void;
  onClipDeleted: (clipId: string) => void;
  onMidiClipDeleted: (clipId: string) => void;
  onClipRenamed: (clipId: string, name: string) => void;
  onTrackRenamed: (trackId: string, name: string) => void;
  onAddTrack: () => void;
  onTracksReordered: (reorderedTracks: Track[]) => void;
  onBottomZoneDrop: (file: File, startMeasure: number) => Promise<void>;
  onImportUseExistingTracks: (files: File[], targetTrackIndex: number, targetStartMeasure: number) => Promise<void>;
  onImportCreateNewTracks: (files: File[], targetStartMeasure: number) => Promise<void>;

  // Playback handlers
  onPlay: () => Promise<void>;
  onStop: () => void;
  onExport: () => Promise<void>;

  // Undo/redo
  pushHistory: (apiUndo: () => void) => void;
  undo: () => void;
  redo: () => void;
}

// ============================================================================
// Context
// ============================================================================

const DawContext = createContext<DawContextValue | null>(null);

export function useDawContext(): DawContextValue {
  const ctx = useContext(DawContext);
  if (!ctx) {
    throw new Error("useDawContext must be used inside a DawProvider");
  }
  return ctx;
}

export { DawContext };
