# Feature Specification: DAW Code Refactoring

**Feature Branch**: `004-daw-refactor`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Code is difficult to read inside apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw. Propose a refactoring with those elements in mind: no props drilling, prefer generating context, hooks and share them between components. no huge file, split big file into subcomponents, utils files, etc. every function that can be excluded from a component, should be moved to a utils file"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Can Understand DAW Code Quickly (Priority: P1)

A developer new to the DAW module opens the directory and can immediately understand what each file does, what state lives where, and how components communicate. They don't need to trace data through deeply-nested prop chains or scroll through 2000+ line files to find a specific behavior.

**Why this priority**: This is the root cause of the refactoring request — the codebase is unreadable today. Solving this unblocks all future DAW development work.

**Independent Test**: A developer can locate, read, and modify any single DAW concern (e.g. undo/redo, clip drag logic, audio playback) by opening at most 2–3 files, without reading the entire codebase.

**Acceptance Scenarios**:

1. **Given** the DAW directory, **When** a developer lists the files, **Then** each file has a name that unambiguously describes its single responsibility (e.g. `-daw-context.tsx`, `-use-daw-playback.ts`, `-clip-utils.ts`).
2. **Given** any component in the DAW, **When** a developer reads it, **Then** they see no prop that is accepted only to be passed straight down to a child without being used.
3. **Given** the `-timeline.tsx` file (currently 77 KB / ~2000+ lines), **When** refactored, **Then** no single file in the DAW directory exceeds 400 lines.

---

### User Story 2 - Developer Adds a DAW Feature Without Touching Unrelated Files (Priority: P2)

A developer implementing a new DAW feature (e.g. clip copy/paste, loop region) only needs to touch the relevant context, hook, or subcomponent — not the root `Daw` or monolithic `Timeline` components.

**Why this priority**: The current architecture forces edits to both root components for any change. Fixing this reduces merge conflicts and lets features be developed independently.

**Independent Test**: Identify a feature that currently requires edits to both `-daw.tsx` and `-timeline.tsx`; after the refactor, the same change touches only the dedicated hook or subcomponent file.

**Acceptance Scenarios**:

1. **Given** the refactored DAW context, **When** a developer adds a new piece of shared DAW state, **Then** they only edit the context definition and its dedicated hook — without modifying the `Daw` root component.
2. **Given** the refactored timeline, **When** a developer changes how clip dragging works, **Then** drag logic lives in a dedicated hook or utils file, not scattered across the main component body.

---

### User Story 3 - Utility Functions Are Discoverable and Independently Testable (Priority: P3)

Pure utility functions (file-type detection, ghost clip position computation, overlap calculation, audio duration reading, etc.) live in dedicated utils files and can be imported and tested independently by any DAW component or test.

**Why this priority**: Today these functions are buried inside component files and cannot be unit-tested or reused without importing the entire component tree.

**Independent Test**: Each utility function can be imported and called in a Vitest unit test without importing any React component.

**Acceptance Scenarios**:

1. **Given** the refactored DAW, **When** a developer searches for `detectFileTypeFromFile`, **Then** it lives in a `*-utils.ts` file, not inside a component file.
2. **Given** a utils file, **When** a developer imports a function from it, **Then** the import does not pull in React, tRPC hooks, or component state.
3. **Given** the utils files, **When** a developer writes a unit test for `computeGhostPosition` or `computeOverlaps`, **Then** the test requires no DOM, component mounting, or mocking of React internals.

---

### Edge Cases

- Refactoring must not change any visible behavior or user-facing DAW functionality (playback, drag & drop, undo/redo, volume, file import, track reordering).
- All Tone.js audio scheduling logic must continue to work identically after the refactor.
- The shared DAW context must be scoped so it is mounted exactly once per DAW instance — no duplicate providers.
- If a function closes over component state (e.g. refs or dispatch functions), it must remain inside a hook or callback — it cannot be moved to a plain utils file.
- Static constant data (layout sizes, GM instrument names) that has no component dependency must be moved to a constants file.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A `DawContext` (React context) MUST be introduced to share DAW state (tracks, clips, midiClips, playback position, BPM, song, organizationId, download URLs) between components, eliminating prop drilling.
- **FR-002**: A dedicated `useDawHistory` hook MUST encapsulate all undo/redo logic: history/future stacks, `pushHistory`, `handleUndo`, `handleRedo`, and keyboard shortcut bindings.
- **FR-003**: A dedicated `useDawPlayback` hook MUST encapsulate all Tone.js playback logic: play, stop, export, player/synth/volume refs, and the RAF playback position ticker.
- **FR-004**: A dedicated `useDawVolume` hook MUST encapsulate volume change handling and debounced persistence.
- **FR-005**: Pure utility functions that do not close over component state MUST be moved to co-located `*-utils.ts` files (e.g. `-file-utils.ts` for file-type detection and duration reading, `-clip-utils.ts` for overlap computation and ghost position, `-constants.ts` for layout constants and the GM instrument names array).
- **FR-006**: `-timeline.tsx` MUST be split into focused subcomponents, each in its own co-located file, with no single file exceeding 400 lines (e.g. `DawRuler`, `DawTrackHeader`, `DawTrackRow`, `DawClip`, `DawMidiClip`, `DawBottomDropZone`).
- **FR-007**: The `TimelineProps` interface MUST be reduced to props that cannot be sourced from context; subcomponents MUST read shared state from context rather than accepting it as drilled props.
- **FR-008**: `-daw.tsx` MUST act only as the composition root: it provides the context, mounts top-level hooks, and renders the layout — no business logic or event handler implementations.
- **FR-009**: All extracted hooks MUST maintain the same observable behavior as the current implementation (no behavioral regressions).

### Key Entities

- **DawContext**: Shared React context carrying DAW state (tracks, clips, midiClips, bpm, song, organizationId, playbackPosition, isPlaying, downloadUrls) and stable dispatch callbacks.
- **useDawHistory**: Hook owning undo/redo stacks, push/undo/redo functions, and keyboard listener setup.
- **useDawPlayback**: Hook owning Tone.js refs (players, synths, volumes, RAF), and play/stop/export handlers.
- **useDawVolume**: Hook owning debounce timers and volume change callback.
- **Timeline subcomponents**: Individual presentational/behavioral components, one per visual region of the timeline.
- **Utils files**: `-file-utils.ts`, `-clip-utils.ts`, `-constants.ts` — importable without React or tRPC.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No file in the DAW directory exceeds 400 lines after the refactor (down from ~2000+ lines for `-timeline.tsx`).
- **SC-002**: The `TimelineProps` interface shrinks from ~25 props to fewer than 8; all removed props are consumed from context.
- **SC-003**: At least 5 pure utility functions are individually importable and unit-testable without mounting a React component.
- **SC-004**: All existing DAW behaviors (playback, drag & drop, undo/redo, volume, MIDI, file import, track reordering) work identically after the refactor — zero regressions.
- **SC-005**: A developer unfamiliar with the DAW can locate the code responsible for any named behavior (e.g. "undo", "clip drag", "MIDI scheduling") within 60 seconds by file name alone.

---

## Assumptions

- The refactoring is purely internal; no API contracts, database schema, or tRPC endpoints change.
- Existing behavior is correct and must be preserved as-is — this is a structural refactor, not a feature addition.
- Storybook files for new DAW subcomponents are out of scope unless a subcomponent is a standalone presentational atom.
- The `DawContext` is scoped to the `Daw` root component; it is not shared outside the DAW route.
