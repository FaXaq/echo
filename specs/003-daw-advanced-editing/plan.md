# Implementation Plan: DAW Advanced Editing

**Branch**: `003-daw-advanced-editing` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-daw-advanced-editing/spec.md`

## Summary

Add 6 interactive editing capabilities to the DAW timeline: multi-file drag-and-drop import with mode selection, rectangular clip selection with horizontal multi-clip movement, single-clip cross-track dragging with direction lock, track header reordering, bottom-of-timeline file drop to create new tracks, and visual overlap indicators for clips stacked on the same track. All editing operations are undoable. Changes are primarily frontend (React, native drag/mouse events) with 3 small backend additions (1 new `track.reorder` endpoint, optional `trackId` on both `updatePosition` endpoints).

## Technical Context

**Language/Version**: TypeScript 5.x + React 18
**Primary Dependencies**: Tone.js v15, @tonejs/midi v2, tRPC, Kysely, Fastify, Tailwind CSS v4, shadcn/ui
**Storage**: PostgreSQL via Kysely (no schema changes — existing `order`, `track_id` columns used)
**Testing**: Vitest
**Target Platform**: Web browser (modern Chromium/Firefox/Safari)
**Performance Goals**: 60fps during all drag operations; no visible jank on groups of 10 clips
**Constraints**: No new npm packages; use native HTML5 mouse/drag events (matching existing code); state stays local (no Zustand migration)
**Scale/Scope**: Single-user DAW session, ≤100 tracks, ≤500 clips per song

## Constitution Check

The constitution file contains only template placeholders — no project-specific gates are defined. No violations to evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/003-daw-advanced-editing/
├── plan.md              ← this file
├── spec.md
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── trpc-endpoints.md
└── tasks.md             ← Phase 2 output (created by /speckit.tasks)
```

### Source Code

```text
# Backend (minimal additions)
apps/api/src/
├── router/organizations/
│   ├── track.ts                  # ADD: track.reorder procedure
│   ├── audio-clip.ts             # MODIFY: updatePosition accepts optional trackId
│   └── midi-clip.ts              # MODIFY: updatePosition accepts optional trackId
packages/app/src/use-cases/
│   ├── track/
│   │   └── reorder-tracks.ts     # NEW use case
│   ├── audio-clip/
│   │   └── update-audio-clip-position.ts  # MODIFY: accept trackId
│   └── midi-clip/
│       └── update-midi-clip-position.ts   # MODIFY: accept trackId

# Frontend (primary work)
apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/
├── -daw.tsx                      # ADD: history state, pendingMultiDrop state
├── -timeline.tsx                 # ADD: selection, selectionRect, DragState (all 6 features)
└── -multi-file-drop-modal.tsx    # NEW: "Use existing tracks" / "Create new tracks" modal
```

## Complexity Tracking

No constitution violations. No complexity justifications required.

---

## Phase 0: Research

**Status**: Complete — see [research.md](./research.md)

Key decisions resolved:
- Undo/redo via in-memory snapshot stack (cap 50), inverse API calls fire-and-forget on undo
- Drag direction lock at 5px threshold on either axis (horizontal = time shift, vertical = track move)
- Multi-file uploads run in parallel (`Promise.allSettled`); clip registration is sequential
- Selection rect via SVG overlay on timeline container
- Overlap indicator via separate `<div>` overlays computed in `useMemo`
- Track reorder: new `track.reorder` tRPC endpoint with batch transaction update
- Cross-track move: extend existing `updatePosition` mutations with optional `trackId`

---

## Phase 1: Design & Contracts

**Status**: Complete

### Data Model

See [data-model.md](./data-model.md) for:
- Existing `Track`, `AudioClip`, `MidiClip` types (unchanged)
- New frontend types: `ClipSelection`, `SelectionRect`, `DragState`, `HistoryEntry`, `MultiFileDropMode`
- No DB migration required
- API contract changes: `updatePosition` extended, `track.reorder` added

### Interface Contracts

See [contracts/trpc-endpoints.md](./contracts/trpc-endpoints.md) for:
- `audioClip.updatePosition` — extended with optional `trackId`
- `midiClip.updatePosition` — extended with optional `trackId`
- `track.reorder` — new endpoint, ordered track ID array, transactional batch update

### Implementation Sequence

Features should be implemented in this order (each is independently testable):

#### Step 1 — Bottom Drop Zone for New Track (FR-013, FR-014)
**Files**: `-timeline.tsx`
- Extend `handleDragOver` to detect when the file ghost is below the last track row
- Show a "Create new track" drop zone indicator (full-width highlighted row)
- Extend `handleDrop`: when `targetTrackIndex >= tracks.length`, call `track.create` first, then existing upload + register flow

#### Step 2 — Multi-File Drop Modal (FR-001, FR-002, FR-003, FR-004)
**Files**: `-timeline.tsx`, `-multi-file-drop-modal.tsx`, `-daw.tsx`
- In `handleDrop`, check `event.dataTransfer.files.length > 1`
- If multi-file: store `PendingMultiFileDrop` in state, show `<MultiFileDropModal>`
- Modal presents two options: **"Use existing tracks"** and **"Create new tracks"**
- On confirm "Use existing tracks": for each file in order, assign to `targetTrackIndex + i`, create track if needed, upload + register in parallel
- On confirm "Create new tracks": for each file, `track.create` sequentially (order matters), then upload + register in parallel

#### Step 3 — Track Reorder (FR-011, FR-012, FR-017)
**Files**: `-timeline.tsx`, `apps/api/src/router/organizations/track.ts`, `packages/app/src/use-cases/track/reorder-tracks.ts`
- Track headers get `onMouseDown` handler for drag detection
- Track header drag creates a `TrackHeaderDragState`; insertion indicator (horizontal line) appears between tracks during hover
- On drop: reorder `tracks` array in local state (optimistic), fire `track.reorder` mutation, push undo entry
- Backend: `makeReorderTracks` use case validates ownership, batch-updates `order` in transaction

#### Step 4 — Cross-Track Clip Move (FR-009, FR-010, FR-017)
**Files**: `-timeline.tsx`, `apps/api/src/router/organizations/audio-clip.ts`, `apps/api/src/router/organizations/midi-clip.ts`, corresponding use cases
- Refactor `handleMouseDown` (audio + MIDI) to use new `ClipDragState` with `lock: null`
- On each `mousemove`, when lock is null: if `|dy| > 5` first → set lock = "vertical" and track `targetTrackIndex`; if `|dx| > 5` first → set lock = "horizontal" (existing behaviour)
- On mouseup with vertical lock: update `clips`/`midiClips` state with new `trackId`, fire `updatePosition({ id, startMeasure, trackId })`, push undo entry
- Visual: highlight target track row during vertical drag

#### Step 5 — Clip Selection & Horizontal Multi-Move (FR-005, FR-006, FR-007, FR-008, FR-017)
**Files**: `-timeline.tsx`
- `onMouseDown` on timeline container background: if target is not a clip, begin selection rect
- Track `selectionRect` state; render as SVG `<rect>` overlay
- On `mouseup`: compute intersection with all clips, set `selection`; clear on bare click
- Refactor clip `mousedown` handler: if the clicked clip is in `selection`, populate `coMovers` list in `ClipDragState`; horizontal lock applies to all co-movers simultaneously
- On mouseup: fire one `updatePosition` mutation per co-mover (parallel), push single undo entry covering all

#### Step 6 — Visual Overlap Indicator (FR-015, FR-016)
**Files**: `-timeline.tsx`
- `const overlapRegions = useMemo(() => computeOverlaps(clips, midiClips, track.id), [clips, midiClips])`
- `computeOverlaps`: for each track, check all clip pairs for `[left, right]` interval overlap; return `{ left, width }` pixel regions
- Render each region as an absolutely positioned `<div>` with `pointer-events-none bg-indigo-400/40` overlay inside the track row

#### Step 7 — Undo/Redo (FR-017)
**Files**: `-daw.tsx`, `-timeline.tsx`
- Add `history: HistoryEntry[]` and `future: HistoryEntry[]` state to `-daw.tsx`
- Expose `pushHistory(apiUndo)` and `undo()` / `redo()` callbacks down to timeline via props
- Wrap every state mutation from Steps 1–6 with `pushHistory`
- Attach `keydown` listener on `window` for `Cmd+Z` / `Ctrl+Z` (undo) and `Cmd+Shift+Z` / `Ctrl+Y` (redo)
- Undo: pop last entry, restore `{ tracks, clips, midiClips }`, call `entry.apiUndo()` fire-and-forget
- Redo: pop first future entry, re-apply state, fire forward mutation fire-and-forget
