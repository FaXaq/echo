# UI Contract: Timeline Drag & Drop

**Feature**: `002-dnd-file-to-track`

This document describes the event-handling contract added to the `-timeline.tsx` component. No new tRPC endpoints or backend contracts are introduced.

---

## Component: Timeline

**File**: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-timeline.tsx`

### New State

```ts
const [dragGhost, setDragGhost] = useState<DragGhost>(null);
const [isDragActive, setIsDragActive] = useState(false);
```

### New Type

```ts
type DragGhost = {
  trackIndex: number;    // 0-indexed; -1 = over ruler/empty area (no ghost shown)
  startMeasure: number;  // 1-indexed, 1/4-measure snapped
  fileType: "audio" | "midi";
} | null;
```

### New Helper Functions

#### `detectFileType(items: DataTransferItemList): "audio" | "midi" | null`

Inspects `DataTransferItem.type` and falls back to filename extension. Returns `null` for unsupported files.

| Input MIME / Extension | Returns |
|------------------------|---------|
| `audio/midi`, `audio/x-midi`, `.mid`, `.midi` | `"midi"` |
| `audio/*` (excluding midi), `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac`, `.m4a` | `"audio"` |
| Anything else | `null` |

#### `computeGhostPosition(e: DragEvent): { trackIndex: number; startMeasure: number } | null`

```
Returns null if:
  - containerRef.current is null
  - cursor is over the ruler (pixelY < RULER_HEIGHT)
  - no tracks exist

Otherwise:
  pixelX       = e.clientX - containerRect.left + containerRef.current.scrollLeft
  startMeasure = Math.max(1, Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4)
  pixelY       = e.clientY - containerRect.top
  trackIndex   = clamp(Math.floor((pixelY - RULER_HEIGHT) / TRACK_HEIGHT), 0, tracks.length - 1)
```

### New Event Handlers (attached to scrollable timeline canvas div)

| Handler | Trigger | Behavior |
|---------|---------|----------|
| `onDragEnter` | File enters the timeline canvas | `e.preventDefault()`, detect file type; if valid: `setIsDragActive(true)` |
| `onDragOver` | File moves over timeline canvas | `e.preventDefault()`, compute ghost position; if over track lane: `setDragGhost(...)`, else `setDragGhost(null)` |
| `onDragLeave` | File leaves the timeline canvas | Only clear state if `!containerRef.current.contains(e.relatedTarget)` |
| `onDrop` | File released over timeline canvas | `e.preventDefault()`, read `e.dataTransfer.files[0]`, detect type, call `handleUploadAudio` or `handleUploadMidi` with `tracks[dragGhost.trackIndex].id` and `dragGhost.startMeasure`, then clear ghost state |

### Rendering Contract

#### Drop Zone Indicator

Applied to the scrollable timeline canvas `<div>` when `isDragActive === true`:

```
Visual: subtle inset ring or border highlight (e.g., ring-2 ring-primary/40)
Applied via: conditional Tailwind class on the container div
```

#### Ghost Clip Overlay

Rendered inside the timeline canvas as an absolutely-positioned `<div>` when `dragGhost !== null` and `dragGhost.trackIndex >= 0`:

```
position: absolute
left:   (dragGhost.startMeasure - 1) * PIXELS_PER_MEASURE
top:    RULER_HEIGHT + dragGhost.trackIndex * TRACK_HEIGHT
width:  PIXELS_PER_MEASURE * 2
height: TRACK_HEIGHT
style:  opacity-50, border-2 border-dashed
color:  audio → blue tint | midi → purple tint (matches existing clip colors)
pointer-events: none (does not interfere with drag events)
```

---

## Reused Functions (unchanged signatures)

These existing functions are called from the drop handler without modification:

```ts
handleUploadAudio(trackId: string, file: File, startMeasure: number): Promise<void>
handleUploadMidi(trackId: string, file: File, startMeasure: number): Promise<void>
```

Both functions already handle: duration extraction → presigned URL → storage PUT → tRPC register → callback.

---

## No Backend Changes

| Layer | Change |
|-------|--------|
| `packages/domain` | None |
| `packages/app` | None |
| `packages/db` | None |
| `apps/api` | None |
| `apps/web` (tRPC calls) | None (same mutations used) |
| `apps/web` (-timeline.tsx) | New drag event handlers + ghost state + rendering |
