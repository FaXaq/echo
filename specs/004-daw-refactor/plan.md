# Implementation Plan: DAW Code Refactoring

**Branch**: `004-daw-refactor` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)

## Summary

Refactor the DAW module (`apps/web/src/routes/.../daw/`) to eliminate two monolithic files (`-daw.tsx` ~1 050 lines, `-timeline.tsx` ~2 000 lines) by introducing a shared `DawContext`, domain-specific hooks, reusable sub-components, and pure utility files. No API, database, or tRPC changes. Zero behavioral regressions.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18
**Primary Dependencies**: React Context API, tRPC client hooks, Tone.js v15, @tonejs/midi v2, TanStack Router, Tailwind CSS v4, shadcn/ui
**Storage**: N/A (pure frontend refactoring — no persistence changes)
**Testing**: Vitest + React Testing Library (existing setup)
**Target Platform**: Browser (same as existing)
**Project Type**: Web application — frontend-only refactoring
**Performance Goals**: No regressions in DAW rendering or audio scheduling
**Constraints**: All existing behaviors preserved exactly; no new npm packages
**Scale/Scope**: 1 route directory, ~3 100 lines of source code to restructure into ~20 focused files

## Constitution Check

The project constitution file is an empty template — no project-specific gates are defined. Standard code quality principles apply:

- [x] No behavioral regressions (covered by SC-004 in spec)
- [x] Dependency direction preserved: context/hooks import from utils; components import from context/hooks; no circular imports
- [x] Follows project conventions: `-` prefix for co-located non-route files, React context for shared state, hooks for stateful logic, `*.ts` for pure utilities
- [x] No new external dependencies introduced

## Project Structure

### Documentation (this feature)

```text
specs/004-daw-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
└── checklists/
    └── requirements.md
```

### Source Code (this feature)

```text
apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/
│
│  ── Pure data (no React, no hooks)
├── -constants.ts                 NEW  Layout constants + GM_INSTRUMENT_NAMES array
├── -daw-types.ts                 NEW  Shared type definitions
├── -file-utils.ts                NEW  Pure file utility functions
├── -clip-utils.ts                NEW  Pure clip/geometry utility functions
│
│  ── Context
├── -daw-context.tsx              NEW  DawContext + DawProvider + useDawContext hook
│
│  ── Domain hooks (depend on context)
├── -use-daw-history.ts           NEW  Undo/redo stacks + keyboard bindings
├── -use-daw-playback.ts          NEW  Tone.js audio engine + RAF ticker
├── -use-daw-volume.ts            NEW  Volume change + debounce
├── -use-daw-file-import.ts       NEW  Multi-file import + bottom-zone single-file drop
│
│  ── Interaction hooks (scoped to Timeline)
├── -use-clip-drag.ts             NEW  Audio + MIDI clip mouse-drag with scroll animation
├── -use-track-header-drag.ts     NEW  Track header reorder drag
├── -use-file-drop.ts             NEW  File drag-over / drop on track rows
├── -use-clip-selection.ts        NEW  Selection rectangle + multi-clip selection state
│
│  ── Visual sub-components
├── -audio-clip-view.tsx          NEW  AudioClipView (waveform canvas, rename, context menu)
├── -midi-clip-view.tsx           NEW  MidiClipView (piano-roll canvas, context menu)
├── -daw-ruler.tsx                NEW  Ruler strip + measure labels + playhead line
├── -daw-track-header.tsx         NEW  Left-panel header (track name, volume slider, instrument select)
├── -daw-track-row.tsx            NEW  Single scrollable track row
├── -daw-bottom-drop-zone.tsx     NEW  Drop target below all tracks
│
│  ── Orchestrators (modified)
├── -timeline.tsx                 MOD  Slim orchestrator ~300 lines
├── -daw.tsx                      MOD  Composition root ~150 lines
│
│  ── Unchanged
├── -multi-file-drop-modal.tsx
├── -daw.stories.tsx
├── -timeline.stories.tsx
├── index.tsx
└── route.tsx
```

**Structure Decision**: Flat co-located files under the existing `daw/` directory, all prefixed with `-` so TanStack Router ignores them. No new sub-directories needed at this scale.

---

## Implementation Steps

### Step 1 — Extract constants and types

**Files created**: `-constants.ts`, `-daw-types.ts`

**`-constants.ts`**:
- Move from `-timeline.tsx`: `PIXELS_PER_MEASURE`, `TRACK_HEIGHT`, `RULER_HEIGHT`, `MIN_MEASURES`, `BUFFER_MEASURES`, `LEFT_PANEL_WIDTH`, `SCROLL_THRESHOLD`, `SCROLL_MAX_SPEED`.
- Move from `-timeline.tsx`: `GM_INSTRUMENT_NAMES` array (128 entries).

**`-daw-types.ts`**:
- Move from `-timeline.tsx`: `DragLock`, `ClipSelection`, `SelectionRect`, `ClipDragState`, `FileDragState`, `TrackHeaderDragState`, `DragState`.
- Move from `-timeline.tsx`: `MultiFileDropMode`, `PendingMultiFileDrop` (keep exports in `-timeline.tsx` as re-exports for backwards compat, then remove once all consumers updated).
- Move from `-daw.tsx`: `HistoryEntry`.
- Add router output type aliases: `Song`, `Track`, `AudioClip`, `MidiClip` (currently duplicated in both files).

**Verification**: No component imports these yet — both source files still compile because nothing has been removed yet.

---

### Step 2 — Extract pure utility functions

**Files created**: `-file-utils.ts`, `-clip-utils.ts`

**`-file-utils.ts`** (zero React, zero tRPC):
- `detectFileTypeFromItems(items: DataTransferItemList): "audio" | "midi" | null` — from `-timeline.tsx` (module-level).
- `detectFileTypeFromFile(file: File): "audio" | "midi" | null` — consolidate from `-timeline.tsx` (module-level) AND the duplicate inner-function in `-daw.tsx`.
- `getAudioDurationMs(file: File): Promise<number | undefined>` — consolidate from both files.

**`-clip-utils.ts`** (zero React, zero tRPC):
- `stripExtension(filename: string): string` — from `-timeline.tsx`.
- `computeGhostPosition(e, container, tracks): { trackIndex, startMeasure } | null` — from `-timeline.tsx`.
- `computeOverlaps(clipRegions): Array<{ left, width }>` — from `-timeline.tsx`.
- `computeClipWidthPx(clip: { durationMs?: number }, secondsPerMeasure: number): number` — extract the `clipWidth` computation currently duplicated in `AudioClipView` and `MidiClipView`.

**Verification**: Add Vitest unit tests for all functions in `-clip-utils.ts` and `-file-utils.ts` (no DOM, no component mount required).

---

### Step 3 — Create DawContext

**File created**: `-daw-context.tsx`

**Contents**:
- `DawContextValue` interface (see research.md for full shape).
- `DawContext` — `React.createContext<DawContextValue>(...)` with a sentinel default that throws if accessed outside a provider.
- `DawProvider` component — accepts all `DawProps` (song, initialTracks, initialClips, initialMidiClips, bpm), owns the primary state (`useState` for tracks, clips, midiClips, isPlaying, isExporting, playbackPosition, editingTrackId, pendingMultiDrop), and wires in the hooks from later steps. Provides the context value.
- `useDawContext()` — convenience hook that calls `useContext(DawContext)` with a guard.

**Note on DawProvider phasing**: In this step, `DawProvider` will initially only hold state and the `setters`. Hooks (`useDawHistory`, `useDawPlayback`, etc.) will be wired in during their respective steps. The provider grows incrementally.

---

### Step 4 — Extract useDawHistory

**File created**: `-use-daw-history.ts`

**Moves from `-daw.tsx`**:
- `history` / `future` state (currently `@ts-expect-error`-suppressed).
- `pushHistory(apiUndo)` callback.
- `handleUndo` callback.
- `handleRedo` callback.
- `useEffect` that attaches `keydown` listener for Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z / Ctrl+Y.

**Hook signature**:
```typescript
export function useDawHistory(
  tracks: Track[], clips: AudioClip[], midiClips: MidiClip[],
  setTracks, setClips, setMidiClips,
): { pushHistory, undo, redo }
```

**Integration**: `DawProvider` calls `useDawHistory(...)` and exposes `pushHistory`, `undo`, `redo` on the context.

---

### Step 5 — Extract useDawPlayback

**File created**: `-use-daw-playback.ts`

**Moves from `-daw.tsx`**:
- Tone.js refs: `playersRef`, `midiScheduledRef`, `midiParsedDataRef`, `volumesRef`, `rafTickRef`, `repeatIdRef`.
- `buildAudioGraph(...)` async function.
- `useEffect` that live-schedules newly uploaded clips during playback (clips key effect).
- `useEffect` that live-schedules newly uploaded MIDI clips during playback (midiClipKey effect).
- `handlePlay()`, `handleStop()`, `handleExport()`.

**Hook signature**:
```typescript
export function useDawPlayback(
  deps: {
    song: Song; bpm: number; clips: AudioClip[]; midiClips: MidiClip[];
    tracks: Track[]; downloadUrlsMap: Map<string, string>;
    isPlaying: boolean; setIsPlaying, setIsExporting, setPlaybackPosition;
    getDownloadUrlsQuery; getMidiDownloadUrlsQuery;
  }
): {
  playersRef; midiScheduledRef; midiParsedDataRef; volumesRef;
  handlePlay; handleStop; handleExport;
  handleClipPositionChanged; handleMidiClipPositionChanged;
}
```

**Note**: `handleClipPositionChanged` and `handleMidiClipPositionChanged` both rely on playback refs and `isPlaying`/`bpm` — they belong here since they perform live Tone.js rescheduling.

**Integration**: `DawProvider` calls `useDawPlayback(...)` and exposes the handlers on the context.

---

### Step 6 — Extract useDawVolume

**File created**: `-use-daw-volume.ts`

**Moves from `-daw.tsx`**:
- `debounceTimers` ref.
- `updateVolume` tRPC mutation call.
- `handleVolumeChanged(trackId, volumeDb)` callback (debounces DB write + calls `volumesRef` ramp).

**Hook signature**:
```typescript
export function useDawVolume(volumesRef: React.MutableRefObject<Map<string, Tone.Volume>>): {
  handleVolumeChanged: (trackId: string, volumeDb: number) => void;
}
```

**Integration**: `DawProvider` (or the hook) wires this in; context exposes `onVolumeChanged`.

---

### Step 7 — Extract useDawFileImport

**File created**: `-use-daw-file-import.ts`

**Moves from `-daw.tsx`**:
- `handleImportUseExistingTracks(files, targetTrackIndex, targetStartMeasure)`.
- `handleImportCreateNewTracks(files, targetStartMeasure)`.
- `handleBottomZoneDrop(file, startMeasure)`.

**Calls**: `detectFileTypeFromFile` and `getAudioDurationMs` from `-file-utils.ts` (no longer duplicated inline).

**Hook signature**:
```typescript
export function useDawFileImport(deps: {
  song: Song; pendingMultiDrop: PendingMultiFileDrop;
  tracks: Track[]; setTracks; setClips; setMidiClips;
  createTrack; getUploadUrl; registerClip; registerMidiClip;
  pushHistory; setPendingMultiDrop;
}): {
  handleImportUseExistingTracks;
  handleImportCreateNewTracks;
  handleBottomZoneDrop;
}
```

**Integration**: `DawProvider` calls this; `onBottomZoneDrop` and `setPendingMultiDrop` are exposed on context.

---

### Step 8 — Extract visual sub-components

**Files created**: `-audio-clip-view.tsx`, `-midi-clip-view.tsx`

**AudioClipView** (already a named function in `-timeline.tsx` near line 1739):
- Move to `-audio-clip-view.tsx` unchanged.
- Update its import of `stripExtension` → from `-clip-utils.ts`.
- Update its import of `PIXELS_PER_MEASURE`, `TRACK_HEIGHT` → from `-constants.ts`.
- Add `computeClipWidthPx` from `-clip-utils.ts` in place of the inline calculation.

**MidiClipView** (already a named function in `-timeline.tsx` near line 1898):
- Move to `-midi-clip-view.tsx` unchanged.
- Same constant/utils import updates.

---

### Step 9 — Extract Timeline sub-components

**Files created**: `-daw-ruler.tsx`, `-daw-track-header.tsx`, `-daw-track-row.tsx`, `-daw-bottom-drop-zone.tsx`

These components are currently rendered inline inside the huge `Timeline` JSX. Extract each into its own file:

**`-daw-ruler.tsx`**: The top ruler strip (measure numbers) and the playhead position line. Reads `playbackPosition`, `isPlaying`, `tracks` length, and `downloadUrls` from `useDawContext()`.

**`-daw-track-header.tsx`**: The fixed left-panel section for each track: track name (phantom-input rename), volume slider, instrument preset selector, delete button. Reads from context; receives `track` as a prop.

**`-daw-track-row.tsx`**: The scrollable right area for a single track: drop zone (file drag-over highlight), renders `AudioClipView` and `MidiClipView` for that track's clips. Receives `track` as a prop; clip data from context; drag callbacks from hooks passed via props.

**`-daw-bottom-drop-zone.tsx`**: The `bottomDropZone` area below all tracks. Reads context for visibility; drag/drop callbacks passed as props.

---

### Step 10 — Extract interaction hooks (scoped to Timeline)

**Files created**: `-use-clip-drag.ts`, `-use-track-header-drag.ts`, `-use-file-drop.ts`, `-use-clip-selection.ts`

These hooks are called inside the slimmed-down `Timeline` component (not in `DawProvider`) because they own ephemeral drag/UI refs and state that have no meaning outside the timeline canvas.

**`-use-clip-drag.ts`**:
- Encapsulates `draggingAudioRef`, `draggingMidiRef`, `scrollAnimRef`, `scrollSpeedRef`, `currentMouseXRef`.
- Returns `handleAudioMouseDown(e, clip)` and `handleMidiMouseDown(e, clip)`.
- Reads `tracks`, `clips`, `midiClips` from context; calls `onClipPositionChanged`, `onMidiClipPositionChanged`, `pushHistory` from context.

**`-use-track-header-drag.ts`**:
- Encapsulates `trackHeaderDragState`.
- Returns drag start/move/end handlers for track header reordering.
- Calls `onTracksReordered` from context.

**`-use-file-drop.ts`**:
- Encapsulates `dragGhost`, `isDragActive` state.
- Returns `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers for a track row.
- Calls `onClipUploaded`, `onMidiClipUploaded`, `setPendingMultiDrop`, `pushHistory` from context.
- Uses `detectFileTypeFromItems`, `detectFileTypeFromFile`, `getAudioDurationMs` from `-file-utils.ts`.

**`-use-clip-selection.ts`**:
- Encapsulates `selectionRect`, `selection` state.
- Returns `handleSelectionMouseDown`, `handleSelectionMouseMove`, `handleSelectionMouseUp`, current `selection`.
- Uses clip positions from context to compute which clips fall within the selection rect.

---

### Step 11 — Slim down Timeline

**File modified**: `-timeline.tsx`

Target: ~300 lines.

After extracting sub-components and interaction hooks, `Timeline`:
1. Calls the 4 interaction hooks.
2. Reads shared state from `useDawContext()` — removing all 25 props except `containerRef` (passed in from parent for scroll control by playback hook).
3. Renders: `<DawRuler>`, `<DawTrackHeader>` + `<DawTrackRow>` for each track, `<DawBottomDropZone>`.
4. Passes drag handlers as props to `<DawTrackRow>` and `<DawTrackHeader>` (these are the event-handler refs that cannot go in context because they capture ephemeral drag state).

The `TimelineProps` interface shrinks from 25 props to ≤5 (e.g. `containerRef`, `scrollContainerRef`).

---

### Step 12 — Slim down Daw (composition root)

**File modified**: `-daw.tsx`

Target: ~150 lines.

1. Wraps everything in `<DawProvider song={song} initialTracks={...} ...>`.
2. `DawProvider` mounts all domain hooks internally.
3. `Daw` itself renders only:
   - The heading + play/stop/export button bar (reads `isPlaying`, `isExporting` from context).
   - `<MultiFileDropModal>` (reads `pendingMultiDrop`, `setPendingMultiDrop` from context).
   - `<Timeline>` — with ≤5 props.
4. Remove all callbacks that were being forwarded as props — they are now consumed from context.

---

### Step 13 — Clean up

- Remove the `// @ts-expect-error` suppressions (the history state will no longer need them once the hook exposes typed read access).
- Remove the duplicated `detectFileTypeFromFile` and `getAudioDurationMs` inner functions from `-daw.tsx`.
- Remove stale re-exports from `-timeline.tsx` (e.g. `PendingMultiFileDrop`, `MultiFileDropMode` are now canonical in `-daw-types.ts`).
- Update any external imports (e.g. `index.tsx`) that import from `-timeline.tsx` or `-daw.tsx`.

---

## Verification Checklist

Before marking each step complete:

- [ ] TypeScript compiles with zero new errors: `pnpm --filter @echo/web tsc --noEmit`
- [ ] DAW route renders and all features work manually (play, stop, export, drag clips, undo, file drop)
- [ ] Unit tests for `-file-utils.ts` and `-clip-utils.ts` pass: `pnpm test --filter @echo/web`
- [ ] No file in `daw/` exceeds 400 lines: `wc -l apps/web/src/routes/**/daw/-*.{ts,tsx}`
- [ ] `TimelineProps` has ≤ 8 props remaining

## Risk Notes

- **Tone.js ref sharing**: `useDawPlayback` returns refs that `handleClipPositionChanged` and `handleMidiClipPositionChanged` need access to. These are returned by the hook and stored by the provider — do not try to put Tone.js objects in React state.
- **Keyboard shortcuts**: The `useDawHistory` keyboard effect must be registered only once. Ensure it is called in `DawProvider`, not in any sub-component that might re-mount.
- **Ref forwarding for containerRef**: The scroll container ref lives in `Timeline` (needed for auto-scroll during drag). The playback RAF reads it only indirectly (scrollLeft). Keep it in Timeline; do not move it to context.
- **tRPC mutations in interaction hooks**: `updateAudioPosition`, `updateMidiPosition` etc. are called inside drag `mouseUp` handlers. These hooks must be called inside the component tree (React rules of hooks), not outside React. They will be called inside `Timeline`.
