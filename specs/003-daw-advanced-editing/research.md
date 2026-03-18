# Research: DAW Advanced Editing

**Branch**: `003-daw-advanced-editing` | **Date**: 2026-03-17

---

## 1. Undo/Redo Pattern for DAW Operations

**Decision**: Lightweight in-memory command stack (array of snapshot diffs), not a full command-object pattern.

**Rationale**: The DAW state is already local React state (`tracks`, `clips`, `midiClips`). The simplest approach is to push snapshots of `{ tracks, clips, midiClips }` before each mutating operation and pop them on undo. For operations that involve API side effects (clip moved, track reordered), re-issue the inverse API call on undo — but keep the state restoration instant so the UI never waits for the network.

**Design**:
```
type HistoryEntry = {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  apiUndo: () => void;   // fires inverse mutation (no-await)
};
```
Stack depth: cap at 50 entries to avoid unbounded memory growth.

**Alternatives considered**:
- Full Command pattern (Command objects with `execute`/`undo` methods): more powerful but significantly more complex for a frontend-only feature; rejected in favour of simplicity.
- Zustand with `temporal` middleware: would require migrating from local useState; rejected as out of scope.

---

## 2. Drag Direction Lock (horizontal vs. cross-track)

**Decision**: Lock direction after the pointer moves more than **5 pixels** on either axis from the initial mousedown position. Whichever axis breaches the threshold first determines the operation for the duration of that drag.

**Rationale**: 5px matches the native browser drag threshold and is imperceptible to users. Any smaller risks accidental locks on jittery devices; any larger delays feedback unacceptably.

**Implementation**:
```
dragLock: null | "horizontal" | "vertical"
```
On each mousemove, if `dragLock` is null, check `|dx| > 5` or `|dy| > 5`. Once set, ignore the other axis for the remainder of the gesture.

**Alternatives considered**:
- Modifier key (Alt/Option for cross-track): more precise but not discoverable; rejected.
- Free 2D movement: risks unintended track changes during horizontal edits; rejected.

---

## 3. Multi-File Drop — Parallel Upload Strategy

**Decision**: Upload all files in parallel using `Promise.allSettled`, then register clips sequentially in track order.

**Rationale**: Upload is the bottleneck. Running uploads in parallel gives near-linear speedup for multiple files. Clip registration is cheap and sequential ordering ensures tracks are created in the correct order before clips reference them.

**Mode: "Use existing tracks"**:
1. Resolve target track indices: start at drop target, go down, auto-create tracks when exhausted.
2. For each (file, trackIndex) pair, call `track.create` if the track doesn't exist yet, then upload + register clip.

**Mode: "Create new tracks"**:
1. For each file, call `track.create` (sequential — each depends on auto-incremented order index), then upload + register.
2. Display upload progress per file via ghost clips with `uploading: true` state.

**Alternatives considered**:
- Sequential uploads: simpler but slow for 5+ files; rejected.
- Single upload-all endpoint: requires new API design; rejected as over-engineered.

---

## 4. Rectangular Clip Selection

**Decision**: SVG overlay `<rect>` drawn on the timeline `<div>`, tracked via `onMouseDown`/`onMouseMove`/`onMouseUp` at the container level. Only activates when `mousedown` target is the timeline background (not an existing clip).

**Rationale**: The timeline already uses absolute positioning with pixel math. An SVG rect matches the coordinate system directly. React portal is not required since the rect is contained within the timeline scroll area.

**Intersection test**: A clip is selected if its pixel rect `[left, left+width] × [top, top+height]` overlaps the selection rect. Use half-open interval: `clipLeft < selRight && clipRight > selLeft`.

**Alternatives considered**:
- Canvas overlay: more rendering code with no benefit over SVG; rejected.
- CSS box-shadow on clips: cannot handle arbitrary selection rects; rejected.

---

## 5. Visual Overlap Indicator

**Decision**: Compute overlapping clip pairs per track in a `useMemo` and render a semi-transparent `<div>` overlay for each overlapping region. The overlay color is a 40% opacity version of the clip color (indigo for audio, emerald for MIDI). When clips of different types overlap, use a neutral purple blend.

**Overlap region**: `[max(clipA.left, clipB.left), min(clipA.left+clipA.width, clipB.left+clipB.width)]`.

**Rationale**: CSS `opacity` on the whole clip would make the waveform/note canvas invisible. A separate overlay `<div>` on top with `pointer-events: none` is cleaner and doesn't disrupt interaction.

**Alternatives considered**:
- Reduce opacity of entire clip: makes waveform unreadable; rejected.
- Hatching pattern via CSS background: visually noisy; rejected.

---

## 6. Track Reorder — Persistence

**Decision**: Add a new tRPC endpoint `track.reorder` that accepts an ordered array of track IDs and batch-updates the `order` column in a single transaction.

**Rationale**: The `track.order` column already exists in the DB. Batch update in a transaction prevents partial-order states during concurrent edits.

**UI approach**: Update local state immediately on drop (optimistic), then fire the mutation. On mutation error, revert to previous order (undo stack entry).

**Alternatives considered**:
- Individually update each `order` with separate mutations: N round-trips; rejected.
- Fractional order (like Notion): more complex, not needed for a DAW with ≤100 tracks; rejected.

---

## 7. Cross-Track Clip Move — API

**Decision**: Extend the existing `audio-clip.updatePosition` and `midi-clip.updatePosition` mutations to accept an optional `trackId` parameter in addition to `startMeasure`. No new endpoint needed.

**Rationale**: The current mutations already update `start_measure`. Adding `track_id` as an optional field in the same mutation keeps the API surface minimal and is a backwards-compatible change.

**Alternatives considered**:
- New `audio-clip.updateTrack` endpoint: unnecessary API surface duplication; rejected.
