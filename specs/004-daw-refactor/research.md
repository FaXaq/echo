# Research: DAW Code Refactoring

**Branch**: `004-daw-refactor` | **Date**: 2026-03-18

## Current State Analysis

### File sizes (the problem)

| File | Size | Lines (approx) |
|------|------|----------------|
| `-daw.tsx` | 37 KB | ~1 050 |
| `-timeline.tsx` | 78 KB | ~2 000+ |
| `-multi-file-drop-modal.tsx` | 2.2 KB | ~60 |

### What lives in `-daw.tsx` today

1. **All shared state**: tracks, clips, midiClips, isPlaying, isExporting, playbackPosition, editingTrackId, pendingMultiDrop, bottomDropZone, history/future stacks.
2. **Tone.js refs**: playersRef, midiScheduledRef, midiParsedDataRef, volumesRef, rafTickRef, repeatIdRef.
3. **Undo/redo logic**: pushHistory, handleUndo, handleRedo, keyboard listener effect.
4. **tRPC queries + memoized URL map**: getDownloadUrls, getMidiDownloadUrls, downloadUrlsMap.
5. **tRPC mutations**: updateVolume, createTrack, reorderTracks, getUploadUrl, registerClip, registerMidiClip.
6. **Duplicate utility functions** (also defined in -timeline): detectFileTypeFromFile, getAudioDurationMs (inner functions, duplicated).
7. **Event handler implementations**: handleTrackDeleted, handleVolumeChanged (with debounce), handleClipUploaded, handleMidiClipUploaded, handleClipPositionChanged (live Tone.js repositioning), handleMidiClipPositionChanged (live reschedule), handleClipDeleted, handleMidiClipDeleted, handleTrackRenamed, handleTracksReordered, handleClipRenamed, handleAddTrack.
8. **Multi-file import logic**: handleImportUseExistingTracks, handleImportCreateNewTracks — each ~80 lines.
9. **Bottom zone drop**: handleBottomZoneDrop — ~60 lines.
10. **Playback engine**: buildAudioGraph (async, ~80 lines), handlePlay, handleStop, handleExport.
11. **Render**: Heading + play/stop/export buttons + `<MultiFileDropModal>` + `<Timeline>` with **25 props**.

### What lives in `-timeline.tsx` today

1. **Layout constants**: PIXELS_PER_MEASURE, TRACK_HEIGHT, RULER_HEIGHT, MIN_MEASURES, BUFFER_MEASURES, LEFT_PANEL_WIDTH, SCROLL_THRESHOLD, SCROLL_MAX_SPEED.
2. **Static data**: GM_INSTRUMENT_NAMES (128-entry array).
3. **Pure utility functions** (at module top-level): getAudioDurationMs, detectFileTypeFromItems, detectFileTypeFromFile, computeGhostPosition, computeOverlaps, stripExtension.
4. **Type definitions**: DragLock, ClipSelection, SelectionRect, ClipDragState, FileDragState, TrackHeaderDragState, DragState, MultiFileDropMode, PendingMultiFileDrop.
5. **TimelineProps interface**: 25+ props (11 data props + 14 callback props).
6. **Timeline component body** (~1 300 lines):
   - 9 refs (containerRef, pendingStartMeasureRef, draggingAudioRef, draggingMidiRef, scrollAnimRef, scrollSpeedRef, currentMouseXRef, fileInputRefs, midiInputRefs).
   - 6 state vars (editingClipId, dragGhost, isDragActive, bottomDropZone, trackHeaderDragState, selectionRect, selection).
   - 13 tRPC mutations.
   - Audio clip drag handler (~250 lines, with inline animate/computeMeasure/handleMouseMove/handleMouseUp closures).
   - MIDI clip drag handler (~similar size).
   - Track header drag handler.
   - File drop handlers (dragover, dragenter, dragleave, drop — each track row).
   - Selection rect handler.
   - Full JSX render (~800 lines).
7. **Sub-components at bottom** (already extracted within the file but not to separate files):
   - `AudioClipView` (~160 lines): waveform canvas, inline rename, context menu, clip export.
   - `MidiClipView` (~60 lines): piano roll canvas preview, context menu.

---

## Key Decisions

### Decision 1: Context scope

**Decision**: A single `DawContext` covering all shared state for the DAW module.

**Rationale**: All components in the `daw/` directory need access to the same tracks/clips/midiClips state, download URLs, playback state, undo/redo callbacks, and editing IDs. A single context avoids a tree of micro-contexts while keeping the provider scoped to the Daw route only.

**Alternatives considered**:
- Multiple fine-grained contexts (PlaybackContext, ClipsContext, etc.) — would solve re-render scope issues in theory but adds complexity without measurable render performance problems in this app.
- Zustand or similar external store — introduces a new dependency; React context is sufficient for this use case.

### Decision 2: Hook granularity

**Decision**: Four domain hooks (`useDawHistory`, `useDawPlayback`, `useDawVolume`, `useDawFileImport`) plus four drag/interaction hooks (`useClipDrag`, `useTrackHeaderDrag`, `useFileDrop`, `useClipSelection`).

**Rationale**: Each hook owns a single concern and its associated refs/state. Hooks that rely on context values take no arguments (they call `useDawContext()` internally); hooks that manage ephemeral UI interactions (drag, selection) live inside the Timeline component and use context for callbacks.

**Alternatives considered**:
- One monolithic `useDaw` hook — would just move the problem from components to a single hook file.
- Hooks as props/injected deps — unnecessary indirection when React context already handles DI.

### Decision 3: Sub-component breakdown for Timeline

**Decision**: Extract `AudioClipView` and `MidiClipView` (already defined inline) to their own files; extract `DawRuler`, `DawTrackHeader`, `DawTrackRow`, `DawBottomDropZone`; keep `Timeline` as a slim orchestrator that composes these.

**Rationale**: The drag handlers close over component refs and state (draggingAudioRef, scrollAnimRef, selection), so they stay as callbacks passed to sub-components — they cannot be plain utils. However, extracting the visual components removes ~800 lines of JSX from the main file.

**Alternatives considered**:
- Extracting drag logic to hooks — feasible for future work but requires careful ref sharing; out of scope for this refactor.

### Decision 4: No external contracts needed

**Decision**: No `contracts/` directory for this refactor.

**Rationale**: This is a purely internal frontend restructuring. No API endpoints, CLI commands, or library interfaces change. The only "contract" is the `DawContext` shape, documented in the context file itself.

### Decision 5: Duplicate code resolution

**Decision**: The `detectFileTypeFromFile` and `getAudioDurationMs` functions defined as inner functions in `-daw.tsx` are duplicates of the module-level functions in `-timeline.tsx`. Both will be consolidated into `-file-utils.ts` and imported from there.

---

## Target File Structure

```text
apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/
├── -constants.ts                 NEW  Layout constants + GM_INSTRUMENT_NAMES
├── -daw-types.ts                 NEW  Shared type definitions (DragLock, ClipSelection, etc.)
├── -file-utils.ts                NEW  Pure file utils (detectFileType*, getAudioDurationMs)
├── -clip-utils.ts                NEW  Pure clip utils (computeGhostPosition, computeOverlaps, stripExtension, computeClipWidth)
├── -daw-context.tsx              NEW  DawContext + DawProvider + useDawContext
├── -use-daw-history.ts           NEW  useDawHistory hook
├── -use-daw-playback.ts          NEW  useDawPlayback hook (Tone.js, buildAudioGraph, play/stop/export)
├── -use-daw-volume.ts            NEW  useDawVolume hook
├── -use-daw-file-import.ts       NEW  useDawFileImport hook (multi-file import, bottom zone drop)
├── -use-clip-drag.ts             NEW  useClipDrag hook (audio + midi drag with scroll animation)
├── -use-track-header-drag.ts     NEW  useTrackHeaderDrag hook
├── -use-file-drop.ts             NEW  useFileDrop hook (file drag-over/drop on track rows)
├── -use-clip-selection.ts        NEW  useClipSelection hook (selection rect + multi-select state)
├── -audio-clip-view.tsx          NEW  AudioClipView component (extracted from timeline)
├── -midi-clip-view.tsx           NEW  MidiClipView component (extracted from timeline)
├── -daw-ruler.tsx                NEW  Ruler strip + playhead line
├── -daw-track-header.tsx         NEW  Left-panel track header (volume, name, instrument preset)
├── -daw-track-row.tsx            NEW  Single track row container
├── -daw-bottom-drop-zone.tsx     NEW  Bottom drop target zone
├── -timeline.tsx                 MOD  Slim orchestrator: uses hooks + renders subcomponents (~300 lines)
├── -daw.tsx                      MOD  Composition root: DawProvider + buttons + modal + Timeline (~150 lines)
├── -multi-file-drop-modal.tsx          Unchanged
├── -daw.stories.tsx                    Unchanged
├── -timeline.stories.tsx               Unchanged
├── index.tsx                           Unchanged
└── route.tsx                           Unchanged
```

---

## DawContext Interface

```typescript
// What DawContext provides (read values + stable callbacks)
interface DawContextValue {
  // Static config
  song: Song;
  bpm: number;
  organizationId: string;

  // Mutable data state (read-only from consumers)
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  downloadUrls: Map<string, string>;

  // Playback state (read-only from consumers)
  isPlaying: boolean;
  isExporting: boolean;
  playbackPosition: number;

  // Editing state
  editingTrackId: string | null;
  setEditingTrackId: (id: string | null) => void;

  // Data mutators (stable callbacks from hooks)
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  setMidiClips: React.Dispatch<React.SetStateAction<MidiClip[]>>;

  // Domain callbacks (stable references)
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
  onTracksReordered: (tracks: Track[]) => void;
  setPendingMultiDrop: (pending: PendingMultiFileDrop) => void;

  // Undo/redo
  pushHistory: (apiUndo: () => void) => void;
  undo: () => void;
  redo: () => void;
}
```

---

## Implementation Order

The following sequencing avoids circular imports and ensures each step is independently verifiable:

1. `-constants.ts` — no deps
2. `-daw-types.ts` — no deps
3. `-file-utils.ts` — no deps
4. `-clip-utils.ts` — depends on `-constants.ts`
5. `-daw-context.tsx` — depends on router output types
6. `-use-daw-history.ts` — depends on `-daw-context.tsx`
7. `-use-daw-playback.ts` — depends on `-daw-context.tsx`
8. `-use-daw-volume.ts` — depends on `-daw-context.tsx`
9. `-use-daw-file-import.ts` — depends on `-daw-context.tsx`, `-file-utils.ts`
10. `-audio-clip-view.tsx` — depends on `-constants.ts`, `-clip-utils.ts`
11. `-midi-clip-view.tsx` — depends on `-constants.ts`, `-clip-utils.ts`
12. `-daw-ruler.tsx` — depends on `-constants.ts`
13. `-daw-track-header.tsx` — depends on `-constants.ts`, `-daw-context.tsx`
14. `-daw-track-row.tsx` — depends on context + clip view components
15. `-daw-bottom-drop-zone.tsx` — depends on `-constants.ts`, `-daw-context.tsx`
16. `-use-clip-drag.ts` — depends on `-constants.ts`, `-daw-context.tsx`
17. `-use-track-header-drag.ts` — depends on `-constants.ts`, `-daw-context.tsx`
18. `-use-file-drop.ts` — depends on `-constants.ts`, `-daw-context.tsx`, `-file-utils.ts`
19. `-use-clip-selection.ts` — depends on `-daw-context.tsx`, `-daw-types.ts`
20. `-timeline.tsx` — depends on all hooks + subcomponents; replace monolith with slim orchestrator
21. `-daw.tsx` — replace with DawProvider wrapper + slim layout
