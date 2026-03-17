# Research: Drag & Drop Files to Timeline Tracks

**Branch**: `002-dnd-file-to-track` | **Phase**: 0

---

## Decision 1: Drag & Drop API

**Decision**: Use the browser's native HTML5 Drag and Drop API (`ondragover`, `ondragenter`, `ondragleave`, `ondrop`) on the timeline canvas container.

**Rationale**: The browser exposes the `DataTransfer.files` list in `ondrop`, which gives access to `File` objects that can be fed directly into the existing `handleUploadAudio` / `handleUploadMidi` functions. No external library is needed. React synthetic events support these handlers natively (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`).

**Alternatives considered**:
- `react-dropzone`: Adds a dependency and wraps functionality already available natively; unnecessary overhead for this targeted timeline integration.
- Pointer Events API: More complex; doesn't provide `DataTransfer.files` needed for OS drag-from-filesystem.

---

## Decision 2: Ghost Clip Positioning

**Decision**: Derive ghost clip position entirely from `DragEvent` coordinates using the same measure-calculation logic already used for the context-menu drop point and existing clip dragging.

**Formula**:
```
pixelX       = event.clientX - containerRect.left + container.scrollLeft
rawMeasure   = pixelX / PIXELS_PER_MEASURE          (0-indexed float)
startMeasure = Math.max(1, Math.round(rawMeasure * 4) / 4)   (1-indexed, 1/4-snapped)
trackIndex   = Math.floor((event.clientY - containerRect.top - RULER_HEIGHT) / TRACK_HEIGHT)
trackIndex   = clamp(trackIndex, 0, tracks.length - 1)
```

**Rationale**: Reuses the exact same snapping and coordinate logic already present in the codebase (`Math.round(measure * 4) / 4`, `PIXELS_PER_MEASURE`, `TRACK_HEIGHT`, `RULER_HEIGHT`). Zero deviation from existing behavior.

**Alternatives considered**:
- Fine-grained 1/16 snap: Inconsistent with the rest of the DAW which snaps at 1/4 measure.
- Free positioning (no snap): Poor UX; clips must land on a grid.

---

## Decision 3: Ghost Clip Width

**Decision**: Render the ghost clip with a fixed width of `PIXELS_PER_MEASURE * 2` (2 measures) regardless of the actual file duration.

**Rationale**: File duration is not known until the file is parsed (which happens asynchronously after drop, not during drag). A fixed 2-measure placeholder is recognizable as a clip and avoids any async work during the drag phase.

**Alternatives considered**:
- Parse file duration during `dragover`: Too expensive; would cause 60 fps jank.
- Width of 1 measure: Too narrow to be visually clear.

---

## Decision 4: File Type Detection

**Decision**: Detect file type from `DataTransfer.items[0].type` (MIME type) during `dragover`, falling back to filename extension.

**MIDI detection**:
- MIME: `audio/midi`, `audio/x-midi`
- Extension fallback: `.mid`, `.midi`

**Audio detection**:
- MIME: starts with `audio/` (excluding midi subtypes)
- Extension fallback: `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac`, `.m4a`

**Rationale**: `DataTransfer.items` is available during `dragover` (unlike `DataTransfer.files` which is only readable in `ondrop`). MIME type is reliable for common audio formats; extension fallback handles edge cases where MIME is `application/octet-stream`.

**Alternatives considered**:
- Read file header magic bytes: Only possible after drop, not during hover. Not needed.
- Accept all files and validate after drop: Produces confusing UX (ghost appears for PDF files).

---

## Decision 5: Reuse of Existing Upload Functions

**Decision**: Call the existing `handleUploadAudio(trackId, file, startMeasure)` and `handleUploadMidi(trackId, file, startMeasure)` functions directly from the `onDrop` handler.

**Rationale**: These functions already handle the full upload lifecycle:
1. Get audio/MIDI duration
2. Obtain presigned upload URL via tRPC
3. PUT file to object storage
4. Register clip via tRPC
5. Fire `onClipUploaded` / `onMidiClipUploaded` callback

No new API endpoints, use cases, or adapters are needed. This feature is **purely a frontend concern**.

**Alternatives considered**:
- New tRPC mutation: No server logic changes needed; would add unnecessary complexity.
- Inline the upload logic: Would duplicate code already maintained in two functions.

---

## Decision 6: Drop Zone Visual State

**Decision**: Track a boolean `isDragActive` state on the timeline container and a `dragGhost` state for the ghost clip. `isDragActive` triggers a subtle ring/border on the container; `dragGhost` controls the ghost overlay inside each track lane.

**`dragGhost` shape**:
```ts
type DragGhost = {
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
} | null;
```

**Rationale**: Two separate state values gives independent control over:
1. The global "drop zone active" indicator (entire timeline)
2. The ghost clip placement (specific track + measure)

**Alternatives considered**:
- Single combined state: Makes it harder to show the outer indicator when cursor is over the ruler (valid drag zone but no specific track target).

---

## Decision 7: `dragLeave` Debouncing

**Decision**: Use `event.relatedTarget` to check if the pointer is still within the container before clearing ghost state in `onDragLeave`.

**Rationale**: `onDragLeave` fires when crossing child elements inside the container (e.g., clip divs, grid lines). Without checking `relatedTarget`, the ghost would flicker constantly as the cursor passes over child elements. The check `!containerRef.current.contains(e.relatedTarget as Node)` avoids false dismissals.

**Alternatives considered**:
- `setTimeout` debounce: Adds latency; ghost could briefly disappear and reappear.
- `onDragLeave` only on the outermost div: React event bubbling still causes issues with child elements.
