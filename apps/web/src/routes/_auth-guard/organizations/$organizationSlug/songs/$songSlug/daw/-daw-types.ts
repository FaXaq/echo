import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

// ============================================================================
// Router output type aliases (canonical — used across all DAW files)
// ============================================================================

type RouterOutput = inferRouterOutputs<AppRouter>;
export type Song = RouterOutput["organization"]["song"]["get"];
export type Track = RouterOutput["organization"]["track"]["list"][number];
export type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];
export type MidiClip = RouterOutput["organization"]["midiClip"]["listBySong"][number];

// ============================================================================
// Undo/redo
// ============================================================================

export type HistoryEntry = {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  apiUndo: () => void;
};

// ============================================================================
// Drag & drop state types
// ============================================================================

export type DragLock = "horizontal" | "vertical" | null;

export type ClipSelection = {
  audioClipIds: Set<string>;
  midiClipIds: Set<string>;
};

export type SelectionRect = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

export type ClipDragState = {
  kind: "clip";
  clipId: string;
  clipType: "audio" | "midi";
  originTrackIndex: number;
  originStartMeasure: number;
  trackIndex: number;
  anchorOffsetPx: number;
  startX: number;
  startY: number;
  lock: DragLock;
  coMovers: Array<{
    clipId: string;
    clipType: "audio" | "midi";
    originTrackIndex: number;
    originStartMeasure: number;
  }>;
};

export type FileDragState = {
  kind: "file";
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
  durationMs?: number;
  uploading?: boolean;
};

export type DragState = ClipDragState | FileDragState | null;

// ============================================================================
// Multi-file drop
// ============================================================================

export type MultiFileDropMode = "use-existing-tracks" | "create-new-tracks";

export type PendingMultiFileDrop = {
  files: File[];
  targetTrackIndex: number;
  targetStartMeasure: number;
} | null;
