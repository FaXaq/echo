# Tasks: DAW Code Refactoring

**Input**: Design documents from `/specs/004-daw-refactor/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓

**Path prefix**: All DAW files live under
`apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/`
Written as `[daw]/` below for readability.

**Tests**: Unit tests are included for the pure utility functions (plan.md Step 2 explicitly requests them). No other test tasks since spec does not request TDD.

**Organization**: Tasks are grouped by user story. Because this is a refactoring, user stories build on each other: US3 (utils) → US2 (context + hooks) → US1 (sub-components + slim orchestrators). The foundational phase unblocks all three.

---

## Phase 1: Setup

**Purpose**: No new project initialization needed (same monorepo, no new packages). This phase is intentionally minimal.

- [ ] T001 Confirm TypeScript compiles cleanly before starting: run `pnpm --filter @echo/web tsc --noEmit` and fix any pre-existing errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract constants and shared types. Zero behavioral change. All later phases import from these files.

**⚠️ CRITICAL**: Complete this phase before starting any user story — all hooks and components depend on these.

- [ ] T002 [P] Create `[daw]/-constants.ts`: move `PIXELS_PER_MEASURE`, `TRACK_HEIGHT`, `RULER_HEIGHT`, `MIN_MEASURES`, `BUFFER_MEASURES`, `LEFT_PANEL_WIDTH`, `SCROLL_THRESHOLD`, `SCROLL_MAX_SPEED`, and `GM_INSTRUMENT_NAMES` array from `-timeline.tsx`
- [ ] T003 [P] Create `[daw]/-daw-types.ts`: move `DragLock`, `ClipSelection`, `SelectionRect`, `ClipDragState`, `FileDragState`, `TrackHeaderDragState`, `DragState`, `MultiFileDropMode`, `PendingMultiFileDrop` from `-timeline.tsx`; move `HistoryEntry` from `-daw.tsx`; add shared router-output type aliases `Song`, `Track`, `AudioClip`, `MidiClip` (currently duplicated in both files)
- [ ] T004 Update `-timeline.tsx` to import constants from `[daw]/-constants.ts` and types from `[daw]/-daw-types.ts`; keep `PendingMultiFileDrop` and `MultiFileDropMode` as re-exports temporarily so `index.tsx` still compiles
- [ ] T005 Update `-daw.tsx` to import `HistoryEntry` and type aliases from `[daw]/-daw-types.ts`
- [ ] T006 Verify TypeScript still compiles: `pnpm --filter @echo/web tsc --noEmit`

**Checkpoint**: Constants and types centralized — user story work can now begin.

---

## Phase 3: User Story 3 — Utility Functions Discoverable and Testable (Priority: P3)

**Goal**: Pure utility functions extracted to their own files, importable and unit-testable without mounting any React component.

**Independent Test**: Import `detectFileTypeFromFile`, `computeGhostPosition`, `computeOverlaps` directly in a Vitest test file and call them with plain arguments — no React, no DOM, no mocks needed.

### Implementation for User Story 3

- [ ] T007 [P] [US3] Create `[daw]/-file-utils.ts`: move `detectFileTypeFromItems` and `detectFileTypeFromFile` (module-level functions) from `-timeline.tsx`; move duplicate inner-function definitions of `detectFileTypeFromFile` and `getAudioDurationMs` from `-daw.tsx`; consolidate into single canonical implementations; export all three functions
- [ ] T008 [P] [US3] Create `[daw]/-clip-utils.ts`: move `stripExtension`, `computeGhostPosition`, `computeOverlaps` from `-timeline.tsx`; add `computeClipWidthPx(durationMs: number | undefined, secondsPerMeasure: number): number` (extracts the clipWidth calculation duplicated in `AudioClipView` and `MidiClipView`)
- [ ] T009 [P] [US3] Write Vitest unit tests for `[daw]/-file-utils.ts`: test `detectFileTypeFromFile` with audio MIME types, MIDI MIME types, file extensions, and unknown types; test `detectFileTypeFromItems` similarly; no DOM required
- [ ] T010 [P] [US3] Write Vitest unit tests for `[daw]/-clip-utils.ts`: test `computeOverlaps` with non-overlapping, overlapping, and adjacent clip regions; test `stripExtension` with common extensions; test `computeClipWidthPx` with known inputs
- [ ] T011 [US3] Update `-timeline.tsx` to remove the now-moved module-level utility functions and import them from `[daw]/-file-utils.ts` and `[daw]/-clip-utils.ts`; update `AudioClipView` and `MidiClipView` inline clip-width calculations to use `computeClipWidthPx`
- [ ] T012 [US3] Update `-daw.tsx` to remove its duplicate inner `detectFileTypeFromFile` and `getAudioDurationMs` functions and import from `[daw]/-file-utils.ts`
- [ ] T013 [US3] Run tests: `pnpm test --filter @echo/web -- -t "file-utils|clip-utils"` — all unit tests must pass

**Checkpoint**: At least 5 pure utility functions are independently unit-testable. US3 is complete.

---

## Phase 4: User Story 2 — Developer Adds Features Without Touching Unrelated Files (Priority: P2)

**Goal**: `DawContext` and domain hooks introduced so that new state or behaviors can be added without modifying the root `Daw` component.

**Independent Test**: Add a mock new state field to `DawContextValue` and verify it can be consumed in a sub-component without editing `-daw.tsx`.

### Implementation for User Story 2

- [ ] T014 [US2] Create `[daw]/-daw-context.tsx`: define `DawContextValue` interface (full shape from research.md); create `DawContext` with a guard sentinel default; create `DawProvider` component that accepts `DawProps` and owns primary state (`tracks`, `clips`, `midiClips`, `isPlaying`, `isExporting`, `playbackPosition`, `editingTrackId`, `pendingMultiDrop`); export `useDawContext()` convenience hook
- [ ] T015 [P] [US2] Create `[daw]/-use-daw-history.ts`: extract `history`/`future` state, `pushHistory` callback, `handleUndo` callback, `handleRedo` callback, and the `useEffect` keyboard listener (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y) from `-daw.tsx`; hook reads `tracks`/`clips`/`midiClips` and their setters as parameters; returns `{ pushHistory, undo, redo }`
- [ ] T016 [P] [US2] Create `[daw]/-use-daw-volume.ts`: extract `debounceTimers` ref, `updateVolume` tRPC mutation, and `handleVolumeChanged` callback (with live Tone.js ramp + debounced DB write) from `-daw.tsx`; hook accepts `volumesRef` parameter; returns `{ handleVolumeChanged }`
- [ ] T017 [US2] Create `[daw]/-use-daw-playback.ts`: extract all Tone.js refs (`playersRef`, `midiScheduledRef`, `midiParsedDataRef`, `volumesRef`, `rafTickRef`, `repeatIdRef`), `buildAudioGraph` async function, both live-scheduling `useEffect`s (clips key + midiClipKey), and `handlePlay`/`handleStop`/`handleExport` from `-daw.tsx`; also extract `handleClipPositionChanged` and `handleMidiClipPositionChanged` (both perform live Tone.js rescheduling and belong here); hook reads from `DawContext`; returns handlers and refs needed by context
- [ ] T018 [US2] Create `[daw]/-use-daw-file-import.ts`: extract `handleImportUseExistingTracks`, `handleImportCreateNewTracks`, and `handleBottomZoneDrop` from `-daw.tsx`; uses `detectFileTypeFromFile`/`getAudioDurationMs` from `-file-utils.ts` (no more inline duplicates); reads song/tracks/pendingMultiDrop from context parameters; returns the three handlers
- [X] T019 [US2] Wire all domain hooks into `DawProvider` in `[daw]/-daw-context.tsx`: call `useDawHistory`, `useDawPlayback`, `useDawVolume`, `useDawFileImport` inside the provider; expose their return values on the context value; add tRPC queries (`getDownloadUrls`, `getMidiDownloadUrls`) and `downloadUrlsMap` memo to the provider
- [X] T020 [US2] Update `-daw.tsx` to wrap its JSX in `<DawProvider>` and remove all state, refs, hooks, and handler implementations that have moved into the context + domain hooks; `-daw.tsx` should now only render the heading, play/stop/export buttons (reading from context), `<MultiFileDropModal>`, and `<Timeline>`; target: ≤ 150 lines
- [X] T021 [US2] Verify TypeScript compiles and DAW functions correctly: `pnpm --filter @echo/web tsc --noEmit`; manually verify play/stop/export/undo/redo/volume in the browser

**Checkpoint**: New state can be added to `DawContextValue` without touching `-daw.tsx`. US2 complete.

---

## Phase 5: User Story 1 — Developer Can Understand DAW Code Quickly (Priority: P1)

**Goal**: No file in `[daw]/` exceeds 400 lines. Timeline split into focused sub-components. All naming unambiguously describes single responsibility.

**Independent Test**: List all files; each name describes exactly one concern. Open `-timeline.tsx` — it is ≤ 400 lines of composition. Open any sub-component — it is self-contained.

### Step A: Extract visual sub-components (parallel)

- [ ] T022 [P] [US1] Create `[daw]/-audio-clip-view.tsx`: move `AudioClipViewProps` interface and `AudioClipView` function (currently at ~line 1725 of `-timeline.tsx`) to its own file; update imports to use `stripExtension`, `computeClipWidthPx` from `-clip-utils.ts` and constants from `-constants.ts`; no behavioral change
- [ ] T023 [P] [US1] Create `[daw]/-midi-clip-view.tsx`: move `MidiClipViewProps` interface and `MidiClipView` function (currently at ~line 1887 of `-timeline.tsx`) to its own file; update imports similarly; no behavioral change
- [ ] T024 [P] [US1] Create `[daw]/-daw-ruler.tsx`: extract the ruler strip (measure number labels row) and the playhead position `<div>` from the `Timeline` JSX; component reads `playbackPosition`, `isPlaying` from `useDawContext()`; accepts `measuresToShow` and `scrollLeft` as props
- [ ] T025 [P] [US1] Create `[daw]/-daw-track-header.tsx`: extract the left-panel section for a single track (track name `PhantomInput`, volume `Slider`, instrument preset `ContextMenu`/`Select`, delete button, drag-grip icon) from the `Timeline` JSX; component receives `track` as a prop; reads callbacks from `useDawContext()`
- [ ] T026 [P] [US1] Create `[daw]/-daw-track-row.tsx`: extract the scrollable right area for a single track (the drop-zone `div` + `AudioClipView`s + `MidiClipView`s for that track) from the `Timeline` JSX; receives `track` as a prop plus drag handler callbacks as props (these closures remain in Timeline); reads clips/midiClips from context
- [ ] T027 [P] [US1] Create `[daw]/-daw-bottom-drop-zone.tsx`: extract the bottom drop zone area from the `Timeline` JSX; reads `bottomDropZone` visibility flag and drop callbacks from props/context

### Step B: Extract interaction hooks (parallel within step)

- [ ] T028 [P] [US1] Create `[daw]/-use-clip-drag.ts`: encapsulate `draggingAudioRef`, `draggingMidiRef`, `scrollAnimRef`, `scrollSpeedRef`, `currentMouseXRef`; implement `handleAudioMouseDown(e, clip)` and `handleMidiMouseDown(e, clip)` (currently ~lines 369–750 of `-timeline.tsx`); reads `tracks`, `clips`, `midiClips` from context via `useDawContext()`; reads `onClipPositionChanged`, `onMidiClipPositionChanged`, `pushHistory` from context; returns the two mouse-down handlers
- [ ] T029 [P] [US1] Create `[daw]/-use-track-header-drag.ts`: encapsulate `trackHeaderDragState`; implement drag-start/drag-move/drag-end handlers for track header reordering; calls `onTracksReordered` from context; returns handlers and `trackHeaderDragState`
- [ ] T030 [P] [US1] Create `[daw]/-use-file-drop.ts`: encapsulate `dragGhost` and `isDragActive` state; implement `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` for a single track row; uses `detectFileTypeFromItems`/`detectFileTypeFromFile`/`getAudioDurationMs` from `-file-utils.ts`; calls `onClipUploaded`, `onMidiClipUploaded`, `setPendingMultiDrop`, `pushHistory` from context; returns handlers and ghost state
- [ ] T031 [P] [US1] Create `[daw]/-use-clip-selection.ts`: encapsulate `selectionRect` and `selection` (`ClipSelection`) state; implement `handleSelectionMouseDown`, `handleSelectionMouseMove`, `handleSelectionMouseUp`; compute which clips fall within the rect using positions from context; returns handlers, current `selection`, and `selectionRect`

### Step C: Slim down Timeline

- [ ] T032 [US1] Rewrite `-timeline.tsx` as a slim orchestrator (~300 lines): call the four interaction hooks (`useClipDrag`, `useTrackHeaderDrag`, `useFileDrop`, `useClipSelection`); read shared state from `useDawContext()`; compose `<DawRuler>`, `<DawTrackHeader>`, `<DawTrackRow>`, `<DawBottomDropZone>`, `<AudioClipView>`, `<MidiClipView>`; remove `TimelineProps` interface (replace with ≤ 5 props); remove `fileInputRefs`/`midiInputRefs` in favour of local hidden `<input>` elements inside `DawTrackHeader`
- [X] T033 [US1] Verify no file in `[daw]/` exceeds 400 lines: `wc -l apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-*.{ts,tsx} | sort -rn | head -20`

### Step D: Final cleanup

- [X] T034 [US1] Remove stale re-exports from `-timeline.tsx` (`PendingMultiFileDrop`, `MultiFileDropMode` are now canonical in `-daw-types.ts`); update `[daw]/index.tsx` and any other consumers to import from `-daw-types.ts`
- [X] T035 [US1] Remove the two `@ts-expect-error` suppressions from the history state in `-daw.tsx` (now moved to `useDawHistory`, which has proper types)
- [X] T036 [US1] Final TypeScript check: `pnpm --filter @echo/web tsc --noEmit` — zero errors
- [X] T037 [US1] Run full test suite: `pnpm test --filter @echo/web` — all tests pass
- [ ] T038 [US1] Manual smoke test: open the DAW, verify play/stop/export, drag a clip, undo/redo, drop a file onto a track, drop a file to the bottom zone, reorder tracks, select multiple clips

**Checkpoint**: All three user stories complete. No file exceeds 400 lines. `TimelineProps` ≤ 5 props. Utils are unit-tested. US1 complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T039 [P] Update `README.md` if the DAW section describes the component structure (add note about context/hooks architecture)
- [X] T040 Verify the `wc -l` count satisfies SC-001 (≤ 400 lines per file) and confirm `TimelineProps` satisfies SC-002 (≤ 8 props, target ≤ 5)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (T001)**: No dependencies — run immediately
- **Phase 2 (T002–T006)**: Depends on T001 — BLOCKS all user story work
- **Phase 3 / US3 (T007–T013)**: Depends on Phase 2 — can start as soon as T006 passes
- **Phase 4 / US2 (T014–T021)**: Depends on Phase 3 (hooks use utils) — start after T013
- **Phase 5 / US1 (T022–T038)**: Depends on Phase 4 (sub-components use context) — start after T021
- **Phase 6 (T039–T040)**: Depends on Phase 5

### User Story Dependencies

- **US3 (P3)**: Starts after Foundational — independently testable (unit tests pass for utils alone)
- **US2 (P2)**: Starts after US3 — verifiable by confirming new context state doesn't require `-daw.tsx` edits
- **US1 (P1)**: Starts after US2 — verifiable by `wc -l` check and no prop drilling in Timeline

### Parallel Opportunities Within Each Phase

**Phase 2** (T002 + T003 in parallel):
- T002 Extract constants
- T003 Extract types

**Phase 3** (T007+T008+T009+T010 in parallel):
- T007 Create -file-utils.ts
- T008 Create -clip-utils.ts
- T009 Tests for -file-utils.ts
- T010 Tests for -clip-utils.ts

**Phase 4** (T015+T016 in parallel after T014):
- T015 useDawHistory
- T016 useDawVolume
- T017 useDawPlayback (sequential — largest hook)
- T018 useDawFileImport (after T015–T017 to reference pushHistory)

**Phase 5 Step A** (T022–T027 all in parallel):
- All 6 visual sub-components have no dependency on each other

**Phase 5 Step B** (T028–T031 all in parallel):
- All 4 interaction hooks have no dependency on each other

---

## Parallel Example: Phase 5 Step A

```bash
# All visual sub-components can be created simultaneously:
Task T022: Create -audio-clip-view.tsx
Task T023: Create -midi-clip-view.tsx
Task T024: Create -daw-ruler.tsx
Task T025: Create -daw-track-header.tsx
Task T026: Create -daw-track-row.tsx
Task T027: Create -daw-bottom-drop-zone.tsx
```

---

## Implementation Strategy

### MVP First (US3 Only — Lowest Risk)

1. Complete Phase 1–2 (T001–T006): Setup + Foundational
2. Complete Phase 3 / US3 (T007–T013): Extract and test pure utils
3. **STOP and validate**: `pnpm test --filter @echo/web` — utils tested; no regressions in DAW behavior
4. Useful even without completing US2/US1 — removes duplicate code and enables future unit testing

### Incremental Delivery

1. Phase 1–2 → foundation ready (T001–T006)
2. Phase 3 / US3 → utils extracted + tested, zero regressions (T007–T013)
3. Phase 4 / US2 → context + hooks, no prop drilling, slim `-daw.tsx` (T014–T021)
4. Phase 5 / US1 → Timeline split, all files ≤ 400 lines (T022–T038)
5. Phase 6 → polish + README (T039–T040)

### One-Developer Strategy (recommended order)

1. T001 → T002+T003 (parallel) → T004 → T005 → T006
2. T007+T008+T009+T010 (parallel) → T011 → T012 → T013
3. T014 → T015+T016 (parallel) → T017 → T018 → T019 → T020 → T021
4. T022–T027 (parallel) → T028–T031 (parallel) → T032 → T033 → T034 → T035 → T036 → T037 → T038
5. T039+T040

---

## Notes

- **[P]** = different files, no blocking dependency on another in-progress task
- **[USN]** = maps task to user story for traceability
- Each phase is independently releasable: US3 is zero-risk (utils only), US2 requires careful context wiring, US1 is the big split
- Tone.js objects must never go into React state — all playback refs stay in `useDawPlayback` and are returned as stable refs
- `containerRef` (scroll container) stays in `Timeline`, not in context — playback RAF does not need it directly
- tRPC mutation hooks (`updateAudioPosition`, etc.) in drag handlers must remain inside the React component tree (Timeline) — do not hoist them into non-component context files
- Commit after each phase checkpoint for clean rollback points
