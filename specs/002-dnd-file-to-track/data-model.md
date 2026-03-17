# Data Model: Drag & Drop Files to Timeline Tracks

**Branch**: `002-dnd-file-to-track` | **Phase**: 1

---

## Overview

This feature introduces **no new database entities, no new tRPC procedures, and no new domain types**. It reuses all existing data structures. The only new "data" lives transiently in component state during a drag interaction.

---

## New Transient UI State

### `DragGhost`

A transient UI type that exists only in React component state inside `-timeline.tsx`. It is **never persisted**.

```ts
type DragGhost = {
  trackIndex: number;    // 0-indexed position within the tracks array
  startMeasure: number;  // 1-indexed, snapped to 1/4-measure precision (e.g. 1, 1.25, 1.5)
  fileType: "audio" | "midi";  // determines ghost clip visual style
} | null;
```

**State transitions**:
```
null
  → DragGhost   on dragenter/dragover (valid file type detected, cursor over track lane)
  → null         on dragleave (leaving container), drop (upload triggered), or invalid drag
```

### `isDragActive: boolean`

A boolean state on the timeline container. `true` while a valid file drag is in progress over the timeline canvas (including ruler and empty space). Controls the drop-zone visual indicator.

```
false → true    on dragenter (valid file detected)
true  → false   on dragleave (leaving container entirely) or drop
```

---

## Existing Entities (unchanged)

All entities are used as-is; no schema changes required.

### `AudioClip`

Created by the existing `registerClip` mutation after a successful audio file drop.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `AudioClipId` | UUID |
| `trackId` | `string` | Target track (from `dragGhost.trackIndex → tracks[i].id`) |
| `fileId` | `string` | References the uploaded `AudioFile` |
| `name` | `string \| null` | Defaults to filename |
| `durationMs` | `number \| null` | Extracted from audio metadata |
| `startMeasure` | `number` | From `dragGhost.startMeasure` |

### `MidiClip`

Created by the existing `registerMidiClip` mutation after a successful MIDI file drop.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `MidiClipId` | UUID |
| `trackId` | `string` | Target track (from `dragGhost.trackIndex → tracks[i].id`) |
| `fileId` | `string` | References the uploaded `AudioFile` (type = "midi") |
| `name` | `string \| null` | Defaults to filename |
| `durationMs` | `number \| null` | Extracted from MIDI parse |
| `startMeasure` | `number` | From `dragGhost.startMeasure` |

### `AudioFile`

Created as part of the upload registration flow (unchanged).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `AudioFileId` | UUID |
| `storageKey` | `string` | Object storage key |
| `filename` | `string` | Original filename |
| `type` | `"audio" \| "midi"` | Set from detected file type |
| `organizationId` | `string` | Current org |

---

## State Transition Diagram

```
User drags file over window
         │
    ┌────▼─────────────────────────────┐
    │ Detect file type from MIME/ext   │
    └────┬──────────────────┬──────────┘
         │ valid             │ invalid
    ┌────▼──────┐       ┌────▼──────┐
    │isDragActive│      │ no state  │
    │= true      │      │ change    │
    └────┬───────┘       └──────────┘
         │ cursor over track lane
    ┌────▼──────────────────────┐
    │ dragGhost = {             │
    │   trackIndex,             │
    │   startMeasure (snapped), │
    │   fileType                │
    │ }                         │
    └────┬──────────────────────┘
         │
    ┌────▼──────┐     ┌──────────────┐
    │ drop      │     │ dragleave    │
    └────┬──────┘     │ (outside)    │
         │            └──────┬───────┘
    ┌────▼──────────────┐    │
    │ clear dragGhost   │    │
    │ clear isDragActive│◄───┘
    │ call uploadFn     │
    └───────────────────┘
```
