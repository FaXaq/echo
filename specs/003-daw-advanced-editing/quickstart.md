# Quickstart: DAW Advanced Editing

**Branch**: `003-daw-advanced-editing`

## Overview

This feature adds 6 editing capabilities to the DAW timeline. All changes are **frontend-dominant** with 3 small backend additions (1 new endpoint, 2 extended inputs).

## Backend Changes (minimal)

### 1. Extend `updatePosition` mutations (audio + MIDI)

In `apps/api/src/router/organizations/audio-clip.ts` and `midi-clip.ts`, add optional `trackId` to the input schema and pass it to the use case. The use case verifies track ownership then updates both `start_measure` and `track_id` in one UPDATE.

### 2. Add `track.reorder` endpoint

In `apps/api/src/router/organizations/track.ts`, add a `reorder` procedure. It accepts an ordered array of track IDs and batch-updates `order` indexes in a DB transaction.

See `contracts/trpc-endpoints.md` for full schemas.

## Frontend Changes (primary work)

All changes are in `-daw.tsx` and `-timeline.tsx`.

### State additions to `-daw.tsx`

```typescript
// Undo/redo history (capped at 50)
const [history, setHistory] = useState<HistoryEntry[]>([]);
const [future, setFuture] = useState<HistoryEntry[]>([]);

// Multi-file drop pending confirmation
const [pendingMultiDrop, setPendingMultiDrop] = useState<PendingMultiFileDrop | null>(null);
```

### State additions to `-timeline.tsx`

```typescript
// Clip selection
const [selection, setSelection] = useState<ClipSelection>({ audioClipIds: new Set(), midiClipIds: new Set() });
const [selectionRect, setSelectionRect] = useState<SelectionRect>(null);

// Unified drag state (replaces existing dragGhost + isDragActive)
const [dragState, setDragState] = useState<DragState>(null);
```

### Feature implementation order (recommended)

1. **Bottom drop zone** — smallest change, builds on existing file drop
2. **Multi-file drop modal** — extend existing `handleDrop`, add `<MultiFileDropModal>` UI component
3. **Track reorder** — drag track headers, backend reorder endpoint
4. **Cross-track clip move** — extend mouse drag with direction lock, backend updatePosition with trackId
5. **Clip selection & horizontal multi-move** — selection rect, co-mover drag
6. **Overlap indicator** — useMemo overlap computation + overlay divs
7. **Undo/redo** — wrap all mutations in history pushes, Cmd+Z handler

### Undo/redo wiring pattern

Every mutating operation follows this pattern:

```typescript
const pushHistory = (apiUndo: () => void) => {
  setHistory(h => [...h.slice(-49), {
    tracks, clips, midiClips, apiUndo
  }]);
  setFuture([]);
};

// Undo handler (attached to window keydown)
if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
  const entry = history[history.length - 1];
  if (!entry) return;
  setFuture(f => [{ tracks, clips, midiClips, apiUndo: /* forward call */ () => {} }, ...f]);
  setTracks(entry.tracks);
  setClips(entry.clips);
  setMidiClips(entry.midiClips);
  entry.apiUndo();   // fire-and-forget
  setHistory(h => h.slice(0, -1));
}
```

### Overlap indicator pattern

```typescript
// In timeline render, per track:
const overlaps = useMemo(() => computeOverlaps(trackClips), [trackClips]);

// computeOverlaps returns array of { left, width } pixel regions
// Each region gets a <div className="absolute pointer-events-none bg-indigo-400/40" />
```
