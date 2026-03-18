# Feature Specification: DAW Advanced Editing

**Feature Branch**: `003-daw-advanced-editing`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "DAW advanced editing: multi-file drag and drop with track options, clip selection and movement on timeline, moving clips between tracks, reordering tracks, drop file to create new track at bottom, visual overlap indicator with opacity"

## Clarifications

### Session 2026-03-17

- Q: What are the labels for the two multi-file import modes? → A: "Use existing tracks" (distribute across existing/new tracks sequentially) and "Create new tracks" (one new track per file).
- Q: When multiple clips are selected across different tracks, can they be moved vertically (to other tracks) as a group? → A: No — multi-clip movement is strictly horizontal; moving a clip to another track is always a single-clip operation.
- Q: Should all editing operations (move clip, cross-track move, reorder tracks, import files) be undoable? → A: Yes — full undo/redo support for all editing operations.
- Q: How does the system distinguish a horizontal clip drag (time shift) from a vertical drag (cross-track move)? → A: Direction lock on first movement — whichever axis exceeds a small threshold first determines the operation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-File Drag & Drop Import (Priority: P1)

A producer drags multiple audio or MIDI files from their file system onto the DAW timeline. A contextual prompt appears offering two modes: **"Use existing tracks"** (distribute files sequentially across the target track and tracks below, creating new ones as needed) or **"Create new tracks"** (create one new auto-named track per file). The selected mode applies and all files are imported accordingly.

**Why this priority**: Core workflow — importing multiple files at once is one of the most frequent tasks in a DAW and is the foundation for many of the other features.

**Independent Test**: Can be fully tested by dragging 3+ files onto the timeline, verifying the mode prompt appears, selecting each mode once, and confirming clips land in the expected tracks.

**Acceptance Scenarios**:

1. **Given** a user drags 3 files onto an existing track, **When** they choose "Use existing tracks", **Then** the first file is placed on the target track, the second on the track below, and the third on a newly created track named "Track XX" (auto-incremented).
2. **Given** a user drags 3 files onto the timeline, **When** they choose "Create new tracks", **Then** 3 new tracks are created, each auto-named "Track XX", each containing its respective file as a clip.
3. **Given** a user drags a single file, **When** the file lands on the timeline, **Then** no mode selection prompt appears — the file is placed directly on the target track as before.

---

### User Story 2 - Clip Selection & Horizontal Movement (Priority: P2)

A producer clicks and drags on an empty area of the timeline to draw a rectangular selection box. All clips whose boundaries overlap the selection box become selected (highlighted). The producer can then drag any selected clip to move all selected clips together **horizontally** along the timeline (left or right), maintaining their relative positions. Moving a clip to a different track is always a single-clip operation and cannot be done as part of a multi-clip drag.

**Why this priority**: Fundamental editing capability — repositioning multiple clips simultaneously is essential for arrangement work.

**Independent Test**: Can be tested by placing 3 clips on the timeline, drawing a selection box over 2 of them, then dragging to confirm they move together while the third stays put.

**Acceptance Scenarios**:

1. **Given** clips exist on the timeline, **When** the user click-drags on empty timeline space, **Then** a visible selection rectangle appears that grows as the user drags.
2. **Given** a selection rectangle is drawn overlapping 2 clips, **When** the drag ends, **Then** those 2 clips are highlighted as selected; clips outside the rectangle are not selected.
3. **Given** 2 clips are selected, **When** the user drags one of them horizontally, **Then** both clips move together, preserving their relative distance along the timeline.
4. **Given** selected clips are moved, **When** a clip would overlap the start of the timeline (position 0), **Then** the movement is clamped so no clip starts before position 0.
5. **Given** a user clicks on empty timeline space without dragging, **When** the click completes, **Then** any current selection is cleared.

---

### User Story 3 - Move Clip to Different Track (Priority: P3)

A producer drags a clip and moves it primarily vertically across track lanes to place it on a different track. The drag direction is locked after a small movement threshold: if the first significant movement is vertical, the operation becomes a cross-track move (timeline position is preserved); if horizontal, it becomes a time shift on the same track. The clip lands on the target track at the same timeline position.

**Why this priority**: Core arrangement editing — cross-track movement is a prerequisite for flexible arrangement.

**Independent Test**: Can be tested by placing a clip on Track 1, dragging it vertically to Track 3, and confirming it now lives on Track 3 at the same start time.

**Acceptance Scenarios**:

1. **Given** a clip is on Track 1, **When** the user drags it over Track 3 and releases, **Then** the clip moves to Track 3 at the same timeline position.
2. **Given** a clip is dragged onto a track that already has a clip at the same position, **Then** the two clips coexist on the same track, shown with the visual overlap indicator (Story 6).
3. **Given** a user begins dragging a clip between tracks, **When** the cursor is over a valid drop target track, **Then** a visual highlight on that track row indicates the drop target.

---

### User Story 4 - Reorder Tracks (Priority: P4)

A producer drags a track header (the label area on the left side) up or down to reorder it relative to other tracks. The track and all its clips move together to the new position in the track list.

**Why this priority**: Arrangement organization — grouping related tracks together is standard DAW workflow.

**Independent Test**: Can be tested by having 4 tracks, dragging Track 4's header above Track 2, and confirming the order becomes Track 1, Track 4, Track 2, Track 3.

**Acceptance Scenarios**:

1. **Given** 4 tracks exist, **When** the user drags Track 3's header above Track 1, **Then** Track 3 appears as the first track and all other tracks shift down by one.
2. **Given** a user begins dragging a track header, **When** they hover between two tracks, **Then** a horizontal insertion indicator line appears at the drop position.
3. **Given** a track header drag ends at the original position, **When** released, **Then** the track order does not change.

---

### User Story 5 - Drag File to Bottom to Create New Track (Priority: P5)

A producer drags a file from the file system and hovers it below all existing tracks. A drop zone indicator appears at the bottom of the track list. Releasing the file there creates a new track with an auto-generated name containing the file as its first clip.

**Why this priority**: Discoverable onboarding path — dropping to the bottom is intuitive and expected by users coming from other DAWs.

**Independent Test**: Can be tested by dragging a single audio file to the area below the last track and confirming a new named track is created with the file placed at the drag position.

**Acceptance Scenarios**:

1. **Given** the user drags a file over the region below the last track, **When** the file enters the drop zone, **Then** a visible "Create new track" drop zone indicator appears.
2. **Given** the user releases the file over the bottom drop zone, **Then** a new track is created, auto-named "Track XX", with the file placed as a clip at the horizontal drop position.
3. **Given** no tracks exist and a file is dragged anywhere in the timeline area, **Then** the same bottom-drop-zone behavior creates the first track.

---

### User Story 6 - Visual Overlap Indicator for Stacked Clips (Priority: P6)

When two clips on the same track overlap in time, both clips are rendered with reduced opacity so the producer can see that a collision exists. The overlapping region is visually distinct from non-overlapping regions.

**Why this priority**: Clarity — without overlap indication, silent collisions confuse users about what will be heard during playback.

**Independent Test**: Can be tested by placing two clips so they overlap on the same track and confirming the overlapping region renders differently from non-overlapping regions.

**Acceptance Scenarios**:

1. **Given** two clips on the same track share a time range, **When** the timeline renders, **Then** the overlapping region is displayed with reduced opacity or a distinct visual treatment.
2. **Given** two clips no longer overlap after one is moved, **When** the timeline re-renders, **Then** both clips return to their standard full-opacity appearance.
3. **Given** three clips overlap on the same region, **Then** the visual treatment still clearly indicates overlap (e.g., further reduced opacity or stacked visual layering).

---

### Edge Cases

- What happens when "Use existing tracks" mode runs out of tracks below the target? → New tracks are auto-created as needed.
- What happens when a selection drag starts on an existing clip? → Treat as a clip-move drag, not a selection drag.
- What happens when the user drags clips beyond the current timeline length? → Extend the timeline automatically.
- What happens when a track is reordered while clips are selected? → The selection remains valid; the moved track and its clips keep their selected state.
- What happens when a clip is dragged from one track to a track that already has a clip at the same position? → Allow it; show overlap indicator.
- What happens after an undo brings a clip back to an overlapping position? → Overlap indicator reappears automatically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to drag multiple files simultaneously onto the timeline and present a mode-selection prompt when more than one file is dropped.
- **FR-002**: In "Use existing tracks" mode, files MUST be distributed sequentially across the target track and tracks below it, creating new tracks as needed for remaining files.
- **FR-003**: In "Create new tracks" mode, each dropped file MUST create its own auto-named track ("Track XX" where XX auto-increments from the highest existing track number).
- **FR-004**: Single-file drops MUST NOT show the mode-selection prompt and MUST use existing single-file behavior.
- **FR-005**: Users MUST be able to draw a rectangular selection by click-dragging on empty timeline space.
- **FR-006**: All clips that overlap the selection rectangle MUST become selected; non-overlapping clips MUST remain unselected.
- **FR-007**: Selected clips MUST move together horizontally when any selected clip is dragged, preserving relative positions between all selected clips. Vertical (cross-track) movement is NOT available for multi-clip selections.
- **FR-008**: Clip horizontal movement MUST be clamped so no clip can be placed before timeline position 0.
- **FR-009**: Users MUST be able to move a clip to a different track by dragging it primarily vertically. The drag direction MUST be locked after a small movement threshold: vertical-first movement triggers a cross-track move; horizontal-first movement triggers a time shift on the same track.
- **FR-010**: A visual drop indicator MUST appear on the target track while a clip is being dragged between tracks.
- **FR-011**: Users MUST be able to drag a track header to reorder it among other tracks.
- **FR-012**: A horizontal insertion indicator MUST appear between tracks while a track header is being dragged.
- **FR-013**: Dragging a file to the area below all existing tracks MUST create a new auto-named track containing that file.
- **FR-014**: A visible "Create new track" drop zone MUST appear when a file is hovered below the last track.
- **FR-015**: When two clips on the same track share overlapping time ranges, the overlapping region MUST be rendered with reduced opacity or a distinct visual treatment.
- **FR-016**: The visual overlap indicator MUST update in real-time whenever clips are moved or resized.
- **FR-017**: All editing operations (clip move, cross-track move, track reorder, multi-file import) MUST be undoable and redoable via standard keyboard shortcuts (Cmd+Z / Ctrl+Z to undo, Cmd+Shift+Z / Ctrl+Y to redo).

### Key Entities

- **Clip**: A placed audio or MIDI file segment on a track at a specific timeline start position and duration. Has a track assignment, start position, and duration.
- **Track**: A horizontal lane in the DAW. Has an order index, a display name, and a list of clips.
- **Selection**: A transient set of clips chosen by the user for batch operations. Not persisted between sessions.
- **Drop Zone**: A visual target area that appears when a file or clip is dragged over a valid drop location (existing track, between tracks, or below all tracks).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can import 5 files in a single drag-and-drop operation in under 10 seconds from drop to all clips placed.
- **SC-002**: Selecting and moving a group of 10 clips causes no visible lag (the movement appears immediate with no perceivable frame drop).
- **SC-003**: 90% of first-time users can reorder a track without referring to documentation (based on usability review).
- **SC-004**: Overlapping clips on the same track are always visually distinguishable from non-overlapping clips without any additional user action.
- **SC-005**: Dragging a file to the bottom drop zone creates a new track 100% of the time with no missed drops.
