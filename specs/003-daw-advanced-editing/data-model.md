# Data Model: DAW Advanced Editing

**Branch**: `003-daw-advanced-editing` | **Date**: 2026-03-17

---

## Existing Entities (unchanged)

### Track
```typescript
type Track = {
  id: TrackId;
  songId: string;
  name: string;
  volume: number;               // dB, -60..+6
  instrumentPreset: number | null;
  order: number;                // 0-based display order — used for reorder feature
  createdAt: Date;
  updatedAt: Date;
};
```

### AudioClip
```typescript
type AudioClip = {
  id: AudioClipId;
  trackId: string;              // mutable — cross-track move updates this
  fileId: string;
  file: AudioFile;
  name: string | null;
  durationMs: number | null;
  startMeasure: number;         // 1-based, snapped to 0.25 increments
  createdAt: Date;
};
```

### MidiClip
```typescript
type MidiClip = {
  id: MidiClipId;
  trackId: string;              // mutable — cross-track move updates this
  fileId: string;
  file: AudioFile;
  name: string | null;
  startMeasure: number;
  durationMs: number | null;
  createdAt: Date;
};
```

---

## New Frontend-Only Types (no DB changes)

### ClipSelection
```typescript
// Transient selection state — never persisted
type ClipSelection = {
  audioClipIds: Set<AudioClipId>;
  midiClipIds: Set<MidiClipId>;
};
```

### SelectionRect
```typescript
// Live selection rectangle during click-drag
type SelectionRect = {
  startX: number;   // timeline-local pixel X at mousedown
  startY: number;
  currentX: number;
  currentY: number;
} | null;
```

### DragState (extends/replaces existing DragGhost)
```typescript
type DragLock = "horizontal" | "vertical" | null;

type ClipDragState = {
  kind: "clip";
  clipId: string;
  clipType: "audio" | "midi";
  originTrackIndex: number;
  originStartMeasure: number;
  anchorOffsetPx: number;       // cursor X offset from clip left edge at grab
  lock: DragLock;
  // For multi-clip drag: all selected clips and their origins
  coMovers: Array<{
    clipId: string;
    clipType: "audio" | "midi";
    originTrackIndex: number;
    originStartMeasure: number;
  }>;
};

type FileDragState = {
  kind: "file";
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
  durationMs?: number;
  uploading?: boolean;
};

type TrackHeaderDragState = {
  kind: "track-header";
  sourceIndex: number;
  insertBeforeIndex: number | null;  // null = insert at end
};

type DragState = ClipDragState | FileDragState | TrackHeaderDragState | null;
```

### HistoryEntry (undo/redo)
```typescript
type HistoryEntry = {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  apiUndo: () => void;   // fires inverse mutation (fire-and-forget)
};

// Stack cap: 50 entries
```

### MultiFileDropModal
```typescript
type MultiFileDropMode = "use-existing-tracks" | "create-new-tracks";

type PendingMultiFileDrop = {
  files: File[];
  targetTrackIndex: number;
  targetStartMeasure: number;
} | null;
```

---

## Database Changes (migrations)

### No new columns required.

All changes are handled by:
1. Extending `audio_clip` and `midi_clip` `UPDATE` statements to accept `track_id` (already a column, just not updated via the position endpoint).
2. The `track.order` column already exists and is already managed by the create endpoint. The new `reorder` endpoint batch-updates it.

---

## API Contract Changes

### Modified: `audio-clip.updatePosition`
```typescript
// Before
input: z.object({ id: z.string(), startMeasure: z.number() })

// After (trackId optional for backwards compatibility)
input: z.object({
  id: z.string(),
  startMeasure: z.number(),
  trackId: z.string().optional(),  // if provided, moves clip to different track
})
```

### Modified: `midi-clip.updatePosition`
```typescript
// Same extension as audio-clip.updatePosition
input: z.object({
  id: z.string(),
  startMeasure: z.number(),
  trackId: z.string().optional(),
})
```

### New: `track.reorder`
```typescript
input: z.object({
  songId: z.string(),
  orderedTrackIds: z.array(z.string()),  // full ordered list of track IDs
})
// Effect: UPDATE track SET order = index WHERE id = orderedTrackIds[index], in a transaction
```
