# Design: dnd-kit/react Sortable Migration

**Date:** 2026-04-12
**Scope:** Replace custom drag-and-drop for track reordering (DAW) and song part reordering (Song index) with `@dnd-kit/react`.

---

## Motivation

Two list-reorder interactions currently use custom implementations:

- **Track headers (DAW):** Raw `mousedown`/`mousemove`/`mouseup` on `document` in `useTrackHeaderDrag`.
- **Song parts (Song index):** Native HTML5 `draggable`/`onDragStart`/`onDragOver`/`onDrop` API.

Both have rough edges (no animation, browser ghost image for song parts, bespoke state machines). `@dnd-kit/react` (v2) provides a clean, React-idiomatic API that matches the intended interaction (vertical sortable list with drag handle) with built-in animation support.

**Out of scope:** Clip drag (time-position canvas with measure-snapping, auto-scroll, co-movers) — fundamentally a 2D free-position operation that dnd-kit is not designed for.

---

## Dependencies

Add to `apps/web`:

```
@dnd-kit/react       # DragDropProvider, useSortable
@dnd-kit/helpers     # move() helper
```

No changes to other packages.

---

## Change 1: Track reordering (DAW)

### Files changed

| File | Action |
|------|--------|
| `daw/hooks/-use-track-header-drag.ts` | **Delete** |
| `daw/-daw-types.ts` | Remove `TrackHeaderDragState` type, remove from `DragState` union |
| `daw/-daw-track-header.tsx` | Replace `onMouseDown` prop with `handleRef` prop |
| `daw/-timeline.tsx` | Replace `useTrackHeaderDrag` usage with `DragDropProvider` + `useSortable` |

### Behaviour preserved

- Grip icon (`GripVertical`) remains the drag handle — `handleRef` from `useSortable` is attached to it.
- On drop, `onTracksReordered(move(tracks, event))` is called.
- `pushHistory` is called with the inverse reorder, preserving undo/redo.

### DawTrackHeader prop change

```ts
// Before
onMouseDown: (e: React.MouseEvent<HTMLDivElement>, trackIndex: number) => void;

// After
handleRef: (el: Element | null) => void;
```

### Timeline wiring

```tsx
<DragDropProvider
  onDragEnd={(event) => {
    if (event.canceled) return;
    const reordered = move(tracks, event);
    onTracksReordered(reordered);
    pushHistory?.(() => onTracksReordered(tracks));
  }}
>
  {tracks.map((track, index) => (
    <SortableTrackRow key={track.id} track={track} index={index} ... />
  ))}
</DragDropProvider>
```

Each row uses `useSortable({ id: track.id, index })` and passes `handleRef` down to `DawTrackHeader`.

The existing drop-indicator line (rendered based on `insertBeforeIndex`) is replaced by dnd-kit's default sort preview (items animate into place during drag). The custom `trackHeaderDragState` overlay is removed.

---

## Change 2: Song part reordering (Song index)

### Files changed

| File | Action |
|------|--------|
| `songs/$songSlug/index.tsx` | Replace native drag state + handlers with `DragDropProvider` + `useSortable` |
| `songs/$songSlug/-section-card.tsx` | Remove `dragging`, `onDragStart`, `onDragOver`, `onDrop` props |

### Behaviour preserved

- Full card is the drag surface (no explicit handle — matches Storybook example).
- On drop, `reorderInstances.mutate({ songId, orderedIds: move(instances, event).map(i => i.id) })`.

### SectionCard prop change

```ts
// Before
dragging?: boolean;
onDragStart?: () => void;
onDragOver?: (e: React.DragEvent) => void;
onDrop?: () => void;

// After
dragging?: boolean;   // renamed from existing prop, driven by isDragging from useSortable
```

`SectionCard` does not receive a ref. The sortable wrapper div (in the parent) holds the `ref` from `useSortable`. The `opacity-40` class on the card is driven by `isDragging()` passed down as the `dragging` prop — no change to `SectionCard`'s internal rendering.

### Song index wiring

```tsx
<DragDropProvider
  onDragEnd={(event) => {
    if (event.canceled) return;
    const reordered = move(instances, event);
    reorderInstances.mutate({ songId: song.id, orderedIds: reordered.map(i => i.id) });
  }}
>
  {instances.map((instance, index) => (
    <SortableSectionRow key={instance.id} instance={instance} index={index} ... />
  ))}
</DragDropProvider>
```

State removed: `draggingId` ref, `dragOverId` state, `handleDrop` function.

---

## Testing

- Manual: drag a track up/down in DAW, confirm order persists after reload, confirm undo reverts.
- Manual: drag a song part up/down in Song index, confirm order persists after reload.
- No automated tests added (no existing DnD tests to match).
