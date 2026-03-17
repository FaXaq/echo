# Feature Specification: Drag & Drop Files to Timeline Tracks

**Feature Branch**: `002-dnd-file-to-track`
**Created**: 2026-03-16
**Status**: Draft
**Input**: User description: "allow user to drag & drop midi / audio files directly to the track by previewing where it would apply"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drop Audio File onto Track (Priority: P1)

A producer has a WAV or MP3 file on their computer and wants to place it directly onto a specific track at a specific position in the arrangement. They drag the file from their file manager over the DAW timeline. As they hover over the timeline, they see a translucent ghost clip that snaps to the nearest beat/measure grid and highlights the target track lane. When they drop, the file is uploaded and appears as a clip at exactly that position.

**Why this priority**: Core interaction that eliminates the multi-step right-click → upload menu flow. Directly addresses how DAW users expect to work.

**Independent Test**: Can be fully tested by dragging a WAV/MP3 file onto any track lane, verifying the ghost preview appears, drops correctly, and the clip plays back — delivers immediate workflow value.

**Acceptance Scenarios**:

1. **Given** a track exists in the timeline, **When** the user drags an audio file (WAV, MP3, OGG, FLAC) from their file system over the track lane, **Then** a semi-transparent ghost clip appears on that track at the nearest snapped measure position.
2. **Given** the ghost clip is visible, **When** the user moves the cursor horizontally, **Then** the ghost clip snaps to 1/4-measure grid positions and updates in real time.
3. **Given** the ghost clip is visible, **When** the user moves the cursor vertically across track lanes, **Then** the ghost clip moves to reflect the new target track.
4. **Given** the ghost clip is correctly positioned, **When** the user releases the mouse button, **Then** the file is uploaded, processed, and a real clip appears at that track and measure position.
5. **Given** a drop is in progress, **When** the user drags outside the timeline area, **Then** the ghost clip disappears and no clip is created.

---

### User Story 2 - Drop MIDI File onto Track (Priority: P1)

A producer wants to place a `.mid` file onto a track to trigger its notes using the track's instrument preset. They drag the MIDI file from their file manager over a track lane and see the same snapping ghost preview. Releasing the mouse creates a MIDI clip at that position.

**Why this priority**: MIDI files are a core file type in the DAW context, on par with audio clips. Same urgency and user expectation.

**Independent Test**: Can be fully tested by dragging a `.mid` file onto a track, verifying the ghost preview, completing the drop, and confirming the MIDI clip plays back with the track instrument.

**Acceptance Scenarios**:

1. **Given** a track exists, **When** the user drags a `.mid` or `.midi` file over the track lane, **Then** a ghost MIDI clip (visually distinct from audio ghost) appears with snapping behavior.
2. **Given** the MIDI ghost is visible, **When** the user releases the mouse, **Then** the MIDI file is uploaded and a MIDI clip is registered at the snapped measure position.
3. **Given** a non-MIDI/non-audio file (e.g. `.pdf`, `.txt`) is dragged over the timeline, **Then** no ghost clip appears and the drag has no effect.

---

### User Story 3 - Visual Drop Zone Feedback (Priority: P2)

When a user begins dragging a file over the DAW timeline, the interface signals that files can be dropped here. Track lanes highlight as valid targets when hovered.

**Why this priority**: Discoverability and polish. Users may not know the feature exists. Clear affordance reduces failed attempts.

**Independent Test**: Can be tested by dragging an audio file over the timeline and confirming (a) the timeline signals it is a drop target, (b) the specific track lane highlights distinctly when hovered.

**Acceptance Scenarios**:

1. **Given** a file is being dragged anywhere over the timeline canvas, **When** the drag enters the timeline, **Then** a subtle visual indicator signals the timeline is a drop target.
2. **Given** the drag is over the ruler or empty space below all tracks, **Then** no ghost clip appears (no valid drop target), but the timeline still shows the drop-zone indicator.
3. **Given** the drag leaves the timeline entirely, **Then** all drop-zone indicators are removed.

---

### Edge Cases

- What happens when the file is too large or the upload fails? The ghost clip disappears; on failure it is removed and an error is shown.
- What happens when dropping a file onto a position that already has a clip? The new clip is placed at the drop position regardless — overlapping clips are permitted.
- What happens when a file with an unsupported extension is dropped? No ghost appears during drag, and if somehow dropped, no clip is created.
- What happens when the user drops onto the left panel (track header area)? The drop is ignored; only the scrollable timeline canvas is a valid drop target.
- What happens when there are no tracks? Dragging a file shows no ghost clip — the user must first create a track.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The timeline canvas MUST accept files dragged from the user's operating system via the browser's native drag-and-drop API.
- **FR-002**: The system MUST display a ghost (semi-transparent) clip preview on the hovered track lane during a valid drag, snapped to the nearest 1/4-measure grid position.
- **FR-003**: The ghost clip MUST follow the cursor horizontally (snapped) and switch to the correct track lane as the cursor moves vertically.
- **FR-004**: The ghost clip MUST be visually distinct from real clips (reduced opacity, dashed or highlighted border) and visually distinguish between audio and MIDI file types.
- **FR-005**: Dropping a valid audio file (WAV, MP3, OGG, FLAC, AAC) onto a track lane MUST trigger the upload-and-register flow, placing the clip at the snapped measure on the target track.
- **FR-006**: Dropping a valid MIDI file (`.mid`, `.midi`) onto a track lane MUST trigger the MIDI upload-and-register flow, placing the clip at the snapped measure on the target track.
- **FR-007**: Files of unsupported types MUST NOT produce a ghost clip and MUST NOT create a clip on drop.
- **FR-008**: Dragging outside the timeline canvas MUST remove the ghost clip and all drop indicators.
- **FR-009**: The timeline MUST display a visual drop-zone indicator when any file is dragged over it, regardless of file type.
- **FR-010**: Dropping onto the ruler, empty space below all tracks, or the left panel MUST be ignored — no clip created.
- **FR-011**: While a file is uploading after a drop, the clip position MUST show a loading/pending state. On success it becomes a real clip; on failure it is removed and an error message is displayed.

### Key Entities

- **Ghost Clip**: A transient visual representation of where a dropped file would be placed. Has a target track, a snapped start measure, and a file type (`audio` | `midi`). Not persisted — exists only as UI state during a drag.
- **AudioClip / MidiClip**: Existing entities created by the drop action using the existing registration use cases.
- **AudioFile**: Existing entity created during the upload step, referenced by the resulting clip.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can place a file onto a track in fewer than 5 seconds from releasing the drag to seeing the clip in the timeline (assuming standard broadband).
- **SC-002**: The ghost clip snapping updates within 16ms of cursor movement (60 fps feedback with no perceptible lag).
- **SC-003**: 100% of dropped files of supported types are correctly placed at the snapped measure on the indicated target track.
- **SC-004**: 100% of dropped files of unsupported types produce no clip and leave the timeline in a clean state.
- **SC-005**: The drop interaction does not interrupt active playback — the transport continues uninterrupted when a file is dropped during playback.

## Assumptions

- The existing upload URL generation, file storage, and clip registration flows are reused without modification — only the trigger changes (drag & drop instead of context menu).
- The 1/4-measure snap grid used for existing clip repositioning is reused for the ghost clip.
- Overlapping clips are permitted; no collision detection is required.
- A drop while playback is active is supported — the clip is added and scheduled live, consistent with existing context-menu upload behavior.
- File type detection uses MIME type from the drag event and/or file extension; deep file inspection is not required.
- The feature applies to the timeline canvas only (the scrollable track/clip area), not the left panel or other UI surfaces.
