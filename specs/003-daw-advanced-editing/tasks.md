# Tasks: DAW Advanced Editing

**Input**: Design documents from `/specs/003-daw-advanced-editing/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story (spec.md priority order) for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US6, from spec.md)

## Path Aliases

> All frontend DAW route files live under:
> `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/`
> referred to below as `daw/`

---

## Phase 1: Setup

**Purpose**: Introduce shared type definitions and the undo/redo scaffolding that every user story builds on.

- [x] T001 Add `ClipSelection`, `SelectionRect`, `DragState` (with `ClipDragState`, `FileDragState`, `TrackHeaderDragState`), `HistoryEntry`, `MultiFileDropMode`, and `PendingMultiFileDrop` type definitions to `daw/-timeline.tsx` (top of file, alongside existing `DragGhost`)
- [x] T002 Add `history`, `future` state arrays and `pushHistory` helper function to `daw/-daw.tsx`; attach `window` `keydown` listener for Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z / Ctrl+Y (redo); pass `pushHistory`, `undo`, `redo` as props to `<Timeline>`

✅ **Phase 1 COMPLETE**

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend endpoint additions and extensions that US3 and US4 depend on.

**⚠️ CRITICAL**: US3 (cross-track move) and US4 (track reorder) cannot be completed until this phase is done. US1, US2, US5, and US6 are frontend-only and can start after Phase 1.

- [x] T003 [P] Extend `updateAudioClipPosition` use case in `packages/app/src/use-cases/audio-clip/` to accept an optional `trackId` field; when provided, validate the target track belongs to the same song and update `track_id` in the DB
- [x] T004 [P] Extend `updateMidiClipPosition` use case in `packages/app/src/use-cases/midi-clip/` to accept an optional `trackId` field with the same ownership validation and DB update
- [x] T005 [P] Extend `audioClip.updatePosition` tRPC procedure input schema in `apps/api/src/router/organizations/audio-clip.ts` to add `trackId: z.string().optional()`; pass through to use case
- [x] T006 [P] Extend `midiClip.updatePosition` tRPC procedure input schema in `apps/api/src/router/organizations/midi-clip.ts` to add `trackId: z.string().optional()`; pass through to use case
- [x] T007 Create `makeReorderTracks` use case in `packages/app/src/use-cases/track/reorder-tracks.ts`; validate all IDs belong to the song, reject duplicates, batch-update `order` in a DB transaction
- [x] T008 Add `track.reorder` tRPC procedure to `apps/api/src/router/organizations/track.ts`; input `{ songId, orderedTrackIds }`; call `makeReorderTracks`; wrap errors with `appErrorToTRPC`

✅ **Phase 2 COMPLETE** — Backend extensions ready — US3 and US4 implementation can now begin.

---

## Phase 3: User Story 1 — Multi-File Drag & Drop Import (Priority: P1) 🎯 MVP

**Goal**: Dropping multiple files on the timeline presents a modal with "Use existing tracks" / "Create new tracks" options and imports all files accordingly.

**Independent Test**: Drag 3 audio files onto an existing track → modal appears → select "Use existing tracks" → 3 clips appear on target track + 2 tracks below (creating new tracks as needed). Repeat with "Create new tracks" → 3 new named tracks each with one clip.

- [x] T009 [US1] In `daw/-timeline.tsx`, update `handleDrop` to detect `event.dataTransfer.files.length > 1`; when true, store `PendingMultiFileDrop` state (files array, targetTrackIndex, targetStartMeasure) instead of immediately importing; leave single-file path unchanged
- [x] T010 [US1] Create `daw/-multi-file-drop-modal.tsx` — modal component presenting "Use existing tracks" and "Create new tracks" buttons; accepts `pendingDrop` prop and `onConfirm(mode)` / `onCancel` callbacks
- [x] T011 [US1] Implement "Use existing tracks" import logic in `daw/-daw.tsx`: for each file in order, resolve target track (existing track at `targetTrackIndex + i`, or call `track.create` if none exists), then run all uploads in parallel via `Promise.allSettled`, then register clips sequentially; show ghost clip with `uploading: true` per file during upload; push a single undo entry after all clips are registered
- [x] T012 [US1] Implement "Create new tracks" import logic in `daw/-daw.tsx`: for each file, call `track.create` sequentially (preserves auto-increment order), then run all uploads in parallel, register clips; push undo entry
- [x] T013 [US1] Render `<MultiFileDropModal>` in `daw/-daw.tsx` when `pendingMultiDrop` is set; wire `onConfirm` to the correct import logic; wire `onCancel` to clear pending state

**Checkpoint**: ✅ Multi-file import is fully functional with both modes. Single-file drop is unaffected.

---

## Phase 4: User Story 2 — Clip Selection & Horizontal Multi-Move (Priority: P2)

**Goal**: Click-dragging on empty timeline space draws a selection rect; selected clips move together horizontally.

**Independent Test**: Place 3 clips → drag-select 2 → drag one selected clip right → both move together by the same delta; third clip is untouched. Click on empty space → selection clears.

- [x] T014 [US2] In `daw/-timeline.tsx`, add `selectionRect` and `selection` state; in the timeline container `onMouseDown`, when the target is the background (not a clip), begin drawing the selection rect; track pointer coordinates on `mousemove`; render selection rect as an SVG `<rect>` overlay with `pointer-events-none`
- [x] T015 [US2] On `mouseup` ending a selection drag: compute which clips' pixel bounds intersect the final rect (half-open interval check: `clipLeft < selRight && clipRight > selLeft`); set `selection` with matching `audioClipIds` / `midiClipIds`; highlight selected clips with a visible selection ring; a bare click on empty space clears selection
- [x] T016 [US2] Refactor clip `mousedown` handler in `daw/-timeline.tsx`: when a drag starts on a clip that is in `selection`, populate `coMovers` in `ClipDragState` with all other selected clips and their origin measures; set `lock = "horizontal"` immediately (multi-move is horizontal only)
- [x] T017 [US2] On `mouseup` with co-movers present: compute delta measures from origin; update all co-mover clips' `startMeasure` in local state (clamped to ≥ 1); fire one `updatePosition` mutation per co-mover in parallel; push a single undo entry covering all
- [x] T018 [US2] Ensure selection is cleared when user clicks empty space, starts a new selection drag, or presses Escape; visual selection highlight removed from all clips on clear

**Status**: ✅ Phase 4 COMPLETE — Drag-to-select, clip highlighting, and multi-clip horizontal drag all functional.

---

## Phase 5: User Story 3 — Move Clip to Different Track (Priority: P3)

**Goal**: Dragging a clip primarily vertically moves it to another track (direction-locked at 5px threshold).

**Independent Test**: Place a clip on Track 1 → drag it downward > 5px → it lands on Track 2 at the same start measure. Drag the same clip sideways > 5px → it moves horizontally on Track 1 only.

- [x] T019 [US3] In `daw/-timeline.tsx`, extend clip `mousedown` handler to initialise `ClipDragState` with `lock: null`; on each `mousemove`, if `lock` is null: check `|dy| > 5` and `|dx| > 5`; first axis to breach 5px sets `lock` ("vertical" or "horizontal") for the remainder of the drag
- [x] T020 [US3] When `lock === "vertical"`: compute `targetTrackIndex` from cursor Y position; update `dragState.trackIndex` live so the clip ghost renders in the target track row; highlight the target track row with a visual indicator
- [x] T021 [US3] On `mouseup` with `lock === "vertical"`: move clip in local state to `targetTrackIndex` (update `trackId`), keep `startMeasure` unchanged; fire `updatePosition({ id, startMeasure, trackId: tracks[targetTrackIndex].id })` mutation; push undo entry that restores original `trackId`
- [x] T022 [US3] Ensure horizontal-lock path continues to work exactly as before (no regression to existing time-shift behaviour); direction lock must not activate during slow/still pointer movement

**Checkpoint**: ✅ Cross-track clip move works via direction lock. Horizontal moves are unaffected.

---

## Phase 6: User Story 4 — Reorder Tracks (Priority: P4)

**Goal**: Dragging a track header reorders it in the track list; order is persisted.

**Independent Test**: 4 tracks → drag Track 3 header above Track 1 → order becomes T1, T3, T2, T4 in the timeline and after page reload.

- [x] T023 [US4] In `daw/-timeline.tsx`, add `onMouseDown` to each track header (left panel label area) that initiates a `TrackHeaderDragState` with `sourceIndex`; on `mousemove`, compute `insertBeforeIndex` from cursor Y; render a horizontal insertion indicator line between tracks at the target position
- [x] T024 [US4] On `mouseup` during track header drag: reorder `tracks` array in local state (move `sourceIndex` to `insertBeforeIndex`); push undo entry that restores original order
- [x] T025 [US4] Fire `track.reorder` mutation with the new ordered array of track IDs after local state update; on mutation error, revert to the previous order via undo entry's `apiUndo`

**Checkpoint**: ✅ Track reorder works visually and persists across page reloads.

---

## Phase 7: User Story 5 — Drag File to Bottom to Create New Track (Priority: P5)

**Goal**: Dropping a file below all existing tracks creates a new named track.

**Independent Test**: Drag one audio file below the last track → "Create new track" drop zone appears → release → new track "Track XX" created with the file as a clip at the drop position.

- [x] T026 [US5] In `daw/-timeline.tsx`, extend `handleDragOver` to detect when the file ghost's Y position exceeds the last track row's bottom edge; when true, set a `bottomDropZone: true` flag in drag state and render a full-width "Create new track" highlighted drop zone row below the last track
- [x] T027 [US5] Extend `handleDrop` in `daw/-daw.tsx`: when `bottomDropZone` is true (or when a single file is dropped and `targetTrackIndex >= tracks.length`), call `track.create` with an auto-incremented name ("Track XX"), then upload + register the clip; push undo entry

**Checkpoint**: ✅ Bottom drop zone creates new track. Drops onto existing tracks are unaffected.

---

## Phase 8: User Story 6 — Visual Overlap Indicator (Priority: P6)

**Goal**: Two clips that share a time range on the same track show a semi-transparent overlay on the overlapping region.

**Independent Test**: Place two audio clips so they overlap by 2 measures → overlapping region renders with a distinctly different appearance. Move one clip away → both return to normal rendering.

- [x] T028 [US6] Add `computeOverlaps(clips: Array<{left: number, width: number}>) → Array<{left: number, width: number}>` pure function to `daw/-timeline.tsx`; for each pair of clips, compute the intersection interval `[max(l1,l2), min(r1,r2)]` if positive
- [x] T029 [US6] In the track row render of `daw/-timeline.tsx`, call `useMemo(() => computeOverlaps([...trackAudioClips, ...trackMidiClips]), [clips, midiClips])` to get overlap regions; render each as an absolutely-positioned `<div>` with `pointer-events-none` and a semi-transparent overlay colour (e.g., `bg-white/30`) on top of the clip stack

**Checkpoint**: ✅ Overlap indicator renders in real time during clip drags and clears when clips no longer overlap.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verify undo/redo wiring across all stories, edge cases, and visual consistency.

- [x] T030 Verify `pushHistory` is called for every mutating operation across all 6 stories: multi-file import (T011–T012), multi-clip move (T017), cross-track move (T021), track reorder (T024), bottom drop zone (T027); confirm Cmd+Z reverses each operation in isolation
- [x] T031 [P] Edge case: clamp all `startMeasure` updates to `≥ 1` when undoing moves that originated near measure 1; verify no clip can be placed at a negative position
- [x] T032 [P] Edge case: when "Use existing tracks" import runs out of existing tracks, verify new tracks are auto-created with correct auto-incremented names ("Track XX") and order indexes
- [x] T033 Run `quickstart.md` validation walkthrough: import 5 files, select/move 10 clips, reorder 4 tracks, verify overlap indicator; confirm no visible frame drops during drag operations

**Checkpoint**: ✅ Phase 9 COMPLETE — All features verified, edge cases handled, undo/redo working across all operations.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks US3 and US4 only
- **Phase 3 (US1)**: Depends on Phase 1 only — can start in parallel with Phase 2
- **Phase 4 (US2)**: Depends on Phase 1 only — can start in parallel with Phase 2
- **Phase 5 (US3)**: Depends on Phase 1 + Phase 2 (needs `trackId` in `updatePosition`)
- **Phase 6 (US4)**: Depends on Phase 1 + Phase 2 (needs `track.reorder` endpoint)
- **Phase 7 (US5)**: Depends on Phase 1 only — can start in parallel with Phase 2
- **Phase 8 (US6)**: Depends on Phase 1 only — can start in parallel with Phase 2
- **Phase 9 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Phase 1 only — independent
- **US2 (P2)**: Phase 1 only — independent
- **US3 (P3)**: Phase 1 + Phase 2 — depends on backend `updatePosition` extension
- **US4 (P4)**: Phase 1 + Phase 2 — depends on `track.reorder` endpoint
- **US5 (P5)**: Phase 1 only — independent
- **US6 (P6)**: Phase 1 only — independent

### Parallel Opportunities Within Phase 2

T003, T004, T005, T006 can all run in parallel (different files).
T007 must precede T008.

---

## Parallel Example: Phase 2

```
Parallel group A (independent files):
  T003 — extend updateAudioClipPosition use case
  T004 — extend updateMidiClipPosition use case
  T005 — extend audio-clip tRPC schema
  T006 — extend midi-clip tRPC schema

Sequential after group A:
  T007 — create reorderTracks use case
  T008 — add track.reorder tRPC procedure
```

## Parallel Example: After Phase 1 Completes

```
Parallel (all independent of Phase 2):
  Phase 3 (US1) — multi-file drop modal
  Phase 4 (US2) — clip selection
  Phase 7 (US5) — bottom drop zone
  Phase 8 (US6) — overlap indicator

Sequential (require Phase 2):
  Phase 5 (US3) — cross-track move
  Phase 6 (US4) — track reorder
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001–T002)
2. Complete Phase 3 (T009–T013) — US1 has no backend dependencies
3. **STOP and VALIDATE**: drag 3 files, confirm both modes work
4. Demo / deploy

### Recommended Implementation Order

Following the plan's recommended sequence (easiest → most complex):

1. Phase 1 (T001–T002) — type defs + undo scaffolding
2. Phase 2 (T003–T008) — backend in parallel with front-end stories below
3. Phase 7 (T026–T027) — US5 bottom drop zone (smallest change, builds confidence)
4. Phase 3 (T009–T013) — US1 multi-file import (extends what US5 touched)
5. Phase 6 (T023–T025) — US4 track reorder (uses Phase 2 backend)
6. Phase 5 (T019–T022) — US3 cross-track move (uses Phase 2 backend)
7. Phase 4 (T014–T018) — US2 clip selection + multi-move
8. Phase 8 (T028–T029) — US6 overlap indicator (pure UI, no mutations)
9. Phase 9 (T030–T033) — polish + undo verification

---

## Notes

- No new npm packages required — all implementation uses existing dependencies
- `[P]` tasks have no shared file dependencies with each other
- Each user story phase is completable and demoable independently
- Undo/redo scaffolding (T001–T002) is the only hard prerequisite for everything; invest in it early
- Total tasks: **33** (T001–T033)
