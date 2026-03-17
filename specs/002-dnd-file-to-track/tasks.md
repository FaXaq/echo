# Tasks: Drag & Drop Files to Timeline Tracks

**Input**: Design documents from `/specs/002-dnd-file-to-track/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

> **Single file changed**: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-timeline.tsx`
> Abbreviated below as `...daw/-timeline.tsx`

---

## Phase 1: Setup

**Purpose**: Confirm no new dependencies are needed before touching code.

- [x] T001 Confirm no new npm packages are required (HTML5 DnD API is native; Tailwind classes already available) — no file changes, just verification

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared types and helper functions that all user stories depend on. Must be complete before any story phase begins.

**⚠️ CRITICAL**: US1, US2, and US3 all depend on these helpers being in place first.

- [x] T002 Add `DragGhost` type and `isDragActive` state variables to ...daw/-timeline.tsx (after existing drag refs, before component return)
- [x] T003 Add `detectFileType(items: DataTransferItemList): "audio" | "midi" | null` helper function to ...daw/-timeline.tsx — checks MIME type first (`audio/midi`, `audio/x-midi`, starts with `audio/`), falls back to filename extension (`.mid`, `.midi`, `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac`, `.m4a`)
- [x] T004 Add `computeGhostPosition(e: DragEvent)` helper function to ...daw/-timeline.tsx — returns `{ trackIndex, startMeasure } | null` using formula: `pixelX = clientX - rect.left + scrollLeft`, `startMeasure = Math.max(1, Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4)`, `trackIndex = clamp(Math.floor((clientY - rect.top - RULER_HEIGHT) / TRACK_HEIGHT), 0, tracks.length - 1)`; returns null if cursor is over ruler or no tracks exist

**Checkpoint**: Types and helpers in place. No visible UI change yet.

---

## Phase 3: User Story 1 — Drop Audio File onto Track (Priority: P1) 🎯 MVP

**Goal**: Drag a WAV/MP3/OGG/FLAC file from the OS onto a track lane → ghost clip snaps to 1/4-measure grid → drop uploads and registers the audio clip at that position.

**Independent Test**: Open DAW with ≥1 track. Drag a `.wav` file over a track lane — ghost clip should appear and snap. Release → upload completes → real audio clip appears at the snapped measure on the target track. Playback should include the new clip.

### Implementation for User Story 1

- [x] T005 [US1] Add `onDragEnter` handler to the scrollable timeline canvas div in ...daw/-timeline.tsx — calls `e.preventDefault()`, reads `e.dataTransfer.items` via `detectFileType`; if result is `"audio"` sets `isDragActive(true)` (MIDI detection deferred to US2; for US1 accept only audio here)
- [x] T006 [US1] Add `onDragOver` handler to the scrollable timeline canvas div in ...daw/-timeline.tsx — calls `e.preventDefault()`, calls `computeGhostPosition`; if over a valid track lane and file is audio: calls `setDragGhost({ trackIndex, startMeasure, fileType: "audio" })`; if over ruler/empty: calls `setDragGhost(null)`
- [x] T007 [US1] Add `onDragLeave` handler to the scrollable timeline canvas div in ...daw/-timeline.tsx — only clears `dragGhost` and `isDragActive` when `!containerRef.current.contains(e.relatedTarget as Node)` to prevent flicker on child element crossings
- [x] T008 [US1] Add `onDrop` handler to the scrollable timeline canvas div in ...daw/-timeline.tsx — calls `e.preventDefault()`, reads `e.dataTransfer.files[0]`, detects type; for audio: calls `handleUploadAudio(tracks[dragGhost.trackIndex].id, file, dragGhost.startMeasure)`, then clears `dragGhost` and `isDragActive`
- [x] T009 [US1] Render ghost clip overlay inside timeline canvas in ...daw/-timeline.tsx — absolutely positioned `<div>` visible when `dragGhost !== null && dragGhost.fileType === "audio"`: `left: (dragGhost.startMeasure - 1) * PIXELS_PER_MEASURE`, `top: RULER_HEIGHT + dragGhost.trackIndex * TRACK_HEIGHT`, `width: PIXELS_PER_MEASURE * 2`, `height: TRACK_HEIGHT - 4`; style: `opacity-50 border-2 border-dashed border-blue-400 bg-blue-400/20 rounded pointer-events-none`

**Checkpoint**: Audio drag & drop fully functional. Ghost appears, snaps, and drop creates a real clip.

---

## Phase 4: User Story 2 — Drop MIDI File onto Track (Priority: P1)

**Goal**: Drag a `.mid` file from the OS onto a track lane → ghost clip with MIDI styling → drop uploads and registers the MIDI clip. Supported alongside audio in the same event handlers.

**Independent Test**: Open DAW with ≥1 track. Drag a `.mid` file over a track lane — ghost clip appears with a distinct purple/violet style. Release → MIDI clip registered → clip plays back using track instrument preset.

**Dependencies**: US1 handlers and ghost rendering must be in place (Phase 3 complete).

### Implementation for User Story 2

- [x] T010 [US2] Extend `onDragEnter` in ...daw/-timeline.tsx to also accept MIDI files — update condition so `isDragActive` is set to true for both `"audio"` and `"midi"` types (not just audio)
- [x] T011 [US2] Extend `onDragOver` in ...daw/-timeline.tsx to set `fileType: "midi"` in dragGhost when a MIDI file is detected — same position logic, different fileType value
- [x] T012 [US2] Extend `onDrop` in ...daw/-timeline.tsx to handle MIDI files — add `else if (type === "midi")` branch calling `handleUploadMidi(tracks[dragGhost.trackIndex].id, file, dragGhost.startMeasure)`
- [x] T013 [US2] Extend ghost clip rendering in ...daw/-timeline.tsx to show a visually distinct MIDI ghost — when `dragGhost.fileType === "midi"`: style with `border-purple-400 bg-purple-400/20` instead of blue; both ghost variants rendered from the same `dragGhost !== null` condition

**Checkpoint**: Both audio and MIDI drag & drop fully functional with visually distinct ghost styles.

---

## Phase 5: User Story 3 — Visual Drop Zone Feedback (Priority: P2)

**Goal**: When any supported file is dragged over the timeline, the entire timeline canvas shows a subtle active border/ring to signal it is a drop target — independent of whether the cursor is over a specific track lane.

**Independent Test**: Drag any audio or MIDI file over the timeline ruler (not a track lane) — the timeline container should show a visual indicator (ring/border) even though no ghost clip appears. Drag the same file outside the timeline — indicator disappears immediately.

**Dependencies**: Foundational phase complete (`isDragActive` state must exist — T002).

### Implementation for User Story 3

- [x] T014 [US3] Apply conditional Tailwind ring class to the scrollable timeline canvas `<div>` in ...daw/-timeline.tsx — add `isDragActive ? "ring-2 ring-inset ring-primary/40" : ""` to its className; this div already has the `onDragEnter`/`onDragLeave` handlers from US1 so `isDragActive` already reflects the correct state

**Checkpoint**: Timeline visually signals it is a drop target whenever a file is dragged over it. Track-lane ghost (from US1/US2) and container ring (US3) work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error states, and robustness improvements across all stories.

- [x] T015 Handle drop when `dragGhost` is null at drop time in ...daw/-timeline.tsx — guard at the top of `onDrop`: if `dragGhost === null` or `tracks[dragGhost.trackIndex]` is undefined, clear state and return early (prevents crash if timing edge case occurs)
- [x] T016 Ensure left panel does NOT accept drops in ...daw/-timeline.tsx — verify `onDragOver` is only attached to the scrollable canvas div (right of `LEFT_PANEL_WIDTH`), not the outer container; add `e.stopPropagation()` in canvas handlers to prevent event bubbling to any outer listener
- [x] T017 Clear ghost state when drag ends without a drop in ...daw/-timeline.tsx — add `onDragEnd` handler on the document (or the canvas) that calls `setDragGhost(null)` and `setIsDragActive(false)`; this handles OS-level drag cancel (e.g. user presses Escape in the file picker)
- [ ] T018 Validate quickstart.md scenarios manually — drag audio file → clip appears ✓, drag MIDI file → MIDI clip appears ✓, drag .pdf → no ghost ✓, drag over ruler → ring but no ghost ✓, drag outside → all indicators clear ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — establishes all event handlers
- **US2 (Phase 4)**: Depends on Phase 3 — extends existing handlers for MIDI
- **US3 (Phase 5)**: Depends on Phase 2 only (`isDragActive`) — can be done in parallel with US1/US2 after Phase 2
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no story dependencies
- **US2 (P1)**: Can start after US1 — extends US1's event handlers
- **US3 (P2)**: Can start after Phase 2 — only needs `isDragActive` state (T002); **parallelizable with US1/US2**

### Within Each Phase

- T002 → T003, T004 can be parallel (all foundational, different code locations)
- T005 → T006 → T007 → T008 → T009 must be sequential (each builds on the handler added before)
- T010, T011, T012, T013 can be done in parallel (extending independent parts of the handlers)
- T014 stands alone (one-line className change)

---

## Parallel Execution Examples

### Foundational phase (after T002)

```
Parallel:
  T003 — Add detectFileType helper
  T004 — Add computeGhostPosition helper
```

### After Phase 3 (US1) is complete

```
Parallel track A:  T010 → T011 → T012 → T013  (US2: MIDI extension)
Parallel track B:  T014                         (US3: drop zone ring)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 + Phase 2 (T001–T004)
2. Complete Phase 3 / US1 (T005–T009)
3. **STOP and VALIDATE**: Drag a WAV file onto a track → ghost → drop → clip plays back
4. Ship or demo — audio drag & drop is fully functional

### Incremental Delivery

1. Phase 1–2 → foundation ready
2. US1 → audio DnD working → MVP
3. US2 → MIDI DnD working
4. US3 → polish: drop zone ring
5. Phase 6 → edge cases hardened

### Parallel Team Strategy

After Phase 2 is complete:
- Developer A: US1 (T005–T009) — core event handlers
- Developer B: US3 (T014) — one-line ring, independent

After US1 complete:
- Developer A: US2 (T010–T013) — MIDI extension
- Developer B: Phase 6 (T015–T018) — polish

---

## Notes

- All changes are in a single file: `...daw/-timeline.tsx`
- No backend, no migrations, no new packages
- The `handleUploadAudio` and `handleUploadMidi` functions already handle the full upload + register lifecycle — just call them from `onDrop`
- `dragLeave` must check `relatedTarget` to avoid ghost flickering on child element crossings (see research.md Decision 7)
- Ghost width is fixed at `PIXELS_PER_MEASURE * 2` — actual duration only known after upload
- `[P]` tasks = different code sections, no sequential dependency
