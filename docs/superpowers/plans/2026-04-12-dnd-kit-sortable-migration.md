# dnd-kit/react Sortable Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom drag-and-drop for track header reordering (DAW) and song part reordering (Song index) with `@dnd-kit/react`.

**Architecture:** Two independent `DragDropProvider` islands — one in the DAW `Timeline` left panel for track headers, one in `SongDetailPage` for song parts. Each sortable item uses `useSortable({ id, index })`. `onDragEnd` calls existing callbacks (`onTracksReordered`, `reorderInstances.mutate`) and undo history unchanged.

**Tech Stack:** `@dnd-kit/react`, `@dnd-kit/helpers` (`move` helper), React 18, TypeScript 5.x, TanStack Router.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/package.json` | Add `@dnd-kit/react`, `@dnd-kit/helpers` |
| `daw/hooks/-use-track-header-drag.ts` | **Delete** |
| `daw/-daw-types.ts` | Remove `TrackHeaderDragState`, remove from `DragState` union |
| `daw/-daw-track-header.tsx` | Replace `onMouseDown` prop with `handleRef` |
| `daw/-sortable-track-header.tsx` | **Create** — `useSortable` wrapper around `DawTrackHeader` |
| `daw/-timeline.tsx` | Wrap left-panel headers in `DragDropProvider`; remove `useTrackHeaderDrag` and insertion indicator |
| `songs/$songSlug/index.tsx` | Wrap section list in `DragDropProvider`; remove native drag state |
| `songs/$songSlug/-section-card.tsx` | Remove `onDragStart`, `onDragOver`, `onDrop` props; keep `dragging` |

All paths are relative to `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/`.

---

## Task 1: Install dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install packages**

```bash
cd apps/web && pnpm add @dnd-kit/react @dnd-kit/helpers
```

Expected: packages appear in `apps/web/package.json` dependencies, lockfile updated.

- [ ] **Step 2: Verify build still passes**

```bash
cd ../.. && pnpm --filter @echo/web build
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add @dnd-kit/react and @dnd-kit/helpers"
```

---

## Task 2: Migrate track header reordering

### 2a — Clean up types

**Files:**
- Modify: `daw/-daw-types.ts`

- [ ] **Step 1: Remove `TrackHeaderDragState` and its union member**

In `daw/-daw-types.ts`, delete the `TrackHeaderDragState` type block and remove `| TrackHeaderDragState` from `DragState`. The file currently reads:

```ts
export type TrackHeaderDragState = {
  kind: "track-header";
  sourceIndex: number;
  insertBeforeIndex: number | null;
};

export type DragState = ClipDragState | FileDragState | TrackHeaderDragState | null;
```

Replace with:

```ts
export type DragState = ClipDragState | FileDragState | null;
```

### 2b — Update DawTrackHeader prop

**Files:**
- Modify: `daw/-daw-track-header.tsx`

- [ ] **Step 2: Replace `onMouseDown` with `handleRef`**

Replace the `DawTrackHeaderProps` interface and the grip `<div>` inside `daw/-daw-track-header.tsx`:

```tsx
// Old interface
export interface DawTrackHeaderProps {
  track: Track;
  trackIndex: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, trackIndex: number) => void;
  onDeleteTrack: (trackId: string) => void;
  onRenameCommit: (trackId: string, newName: string, currentName: string) => void;
}
```

```tsx
// New interface
export interface DawTrackHeaderProps {
  track: Track;
  trackIndex: number;
  handleRef: (el: Element | null) => void;
  onDeleteTrack: (trackId: string) => void;
  onRenameCommit: (trackId: string, newName: string, currentName: string) => void;
}
```

Replace the grip `<div>` that currently has `onMouseDown={(e) => onMouseDown(e, trackIndex)}`:

```tsx
// Old
<div
  data-drag-handle
  className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
  onMouseDown={(e) => onMouseDown(e, trackIndex)}
  title={t("Drag to reorder track")}
>
  <GripVertical size={16} />
</div>
```

```tsx
// New
<div
  ref={handleRef as React.Ref<HTMLDivElement>}
  className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
  title={t("Drag to reorder track")}
>
  <GripVertical size={16} />
</div>
```

Also remove the unused `trackIndex` prop usage (it was only used for `onMouseDown`). Keep `trackIndex` in the interface if it's used elsewhere in the component; otherwise remove it. Looking at the current component body, `trackIndex` is only passed to `onMouseDown` — remove it from the interface too:

```tsx
export interface DawTrackHeaderProps {
  track: Track;
  handleRef: (el: Element | null) => void;
  onDeleteTrack: (trackId: string) => void;
  onRenameCommit: (trackId: string, newName: string, currentName: string) => void;
}
```

Add `import type React from "react"` if not already present (it is already at line 1 of the original file — no change needed).

### 2c — Create sortable wrapper

**Files:**
- Create: `daw/-sortable-track-header.tsx`

- [ ] **Step 3: Create `-sortable-track-header.tsx`**

```tsx
import { useSortable } from "@dnd-kit/react/sortable";
import { DawTrackHeader, type DawTrackHeaderProps } from "./-daw-track-header";
import { TRACK_HEIGHT } from "./-constants";

type SortableTrackHeaderProps = Omit<DawTrackHeaderProps, "handleRef"> & {
  index: number;
};

export function SortableTrackHeader({ index, track, ...props }: SortableTrackHeaderProps) {
  const { ref, handleRef, isDragging } = useSortable({ id: track.id, index });

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ height: TRACK_HEIGHT, opacity: isDragging ? 0.5 : 1 }}
    >
      <DawTrackHeader track={track} handleRef={handleRef} {...props} />
    </div>
  );
}
```

Add `import type React from "react"` at the top.

### 2d — Update Timeline

**Files:**
- Modify: `daw/-timeline.tsx`
- Delete: `daw/hooks/-use-track-header-drag.ts`

- [ ] **Step 4: Remove `useTrackHeaderDrag` and add `DragDropProvider`**

In `daw/-timeline.tsx`:

1. Remove the import of `useTrackHeaderDrag`:
   ```ts
   // Delete this line:
   import { useTrackHeaderDrag } from "./hooks/-use-track-header-drag";
   ```

2. Add new imports at the top of the file:
   ```ts
   import { DragDropProvider } from "@dnd-kit/react";
   import { move } from "@dnd-kit/helpers";
   import { SortableTrackHeader } from "./-sortable-track-header";
   ```

3. Remove the `useTrackHeaderDrag` call (lines 192–197 in the original):
   ```ts
   // Delete these lines:
   const { trackHeaderDragState, handleTrackHeaderMouseDown } = useTrackHeaderDrag({
     containerRef,
     tracks,
     onTracksReordered,
     pushHistory,
   });
   ```

4. In the JSX left panel, replace the `tracks.map(...)` rendering of `DawTrackHeader` plus the insertion indicator with:

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
       <SortableTrackHeader
         key={track.id}
         track={track}
         index={index}
         onDeleteTrack={handleDeleteTrack}
         onRenameCommit={handleRenameCommit}
       />
     ))}
   </DragDropProvider>
   ```

   The old code block to replace (lines 263–284 in the original):
   ```tsx
   {tracks.map((track, trackIndex) => (
     <DawTrackHeader
       key={track.id}
       track={track}
       trackIndex={trackIndex}
       onMouseDown={handleTrackHeaderMouseDown}
       onDeleteTrack={handleDeleteTrack}
       onRenameCommit={handleRenameCommit}
     />
   ))}

   {/* Insertion indicator zone during track reorder drag */}
   {trackHeaderDragState && trackHeaderDragState.insertBeforeIndex !== null && (
     <div
       className="absolute left-0 right-0 border-t-4 border-primary bg-primary/10 pointer-events-none"
       style={{
         top: RULER_HEIGHT + (trackHeaderDragState.insertBeforeIndex * TRACK_HEIGHT),
         height: TRACK_HEIGHT * 0.4,
         marginTop: -(TRACK_HEIGHT * 0.2),
       }}
     />
   )}
   ```

5. Remove `DawTrackHeader` from imports if it's no longer directly used in `Timeline`:
   ```ts
   // Delete this line:
   import { DawTrackHeader } from "./-daw-track-header";
   ```

- [ ] **Step 5: Delete the old hook file**

```bash
rm apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/hooks/-use-track-header-drag.ts
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm --filter @echo/web tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Manual test — track reorder**

Start dev server (`pnpm dev`), open the DAW, drag tracks up and down by the grip icon, confirm:
- Items animate during drag.
- Releasing re-orders the list.
- Order persists after page reload.
- Ctrl+Z undoes the reorder.

- [ ] **Step 8: Commit**

```bash
git add \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-daw-types.ts \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-daw-track-header.tsx \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-sortable-track-header.tsx \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-timeline.tsx
git rm apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/hooks/-use-track-header-drag.ts
git commit -m "feat(daw): replace custom track-header drag with @dnd-kit/react"
```

---

## Task 3: Migrate song part reordering

### 3a — Clean up SectionCard

**Files:**
- Modify: `songs/$songSlug/-section-card.tsx`

- [ ] **Step 1: Remove native drag props from `SectionCard`**

In `-section-card.tsx`, update the `Props` type — remove `onDragStart`, `onDragOver`, `onDrop` and keep only `dragging`:

```ts
// Old
type Props = {
  instance: SectionInstance;
  viewMode: ViewMode;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
};
```

```ts
// New
type Props = {
  instance: SectionInstance;
  viewMode: ViewMode;
  dragging?: boolean;
};
```

Update the destructured props in `SectionCard`:

```tsx
// Old
export function SectionCard({ instance, viewMode, dragging, onDragStart, onDragOver, onDrop }: Props) {
```

```tsx
// New
export function SectionCard({ instance, viewMode, dragging }: Props) {
```

Remove the `draggable` attribute and event handlers from the outer `<div>`:

```tsx
// Old
<div
  className={[
    "rounded-lg border border-border bg-card transition-opacity",
    dragging ? "opacity-40" : "",
  ].join(" ")}
  draggable
  onDragStart={onDragStart}
  onDragOver={e => { e.preventDefault(); onDragOver?.(e); }}
  onDrop={onDrop}
>
```

```tsx
// New
<div
  className={[
    "rounded-lg border border-border bg-card transition-opacity",
    dragging ? "opacity-40" : "",
  ].join(" ")}
>
```

### 3b — Update SongDetailPage

**Files:**
- Modify: `songs/$songSlug/index.tsx`

- [ ] **Step 2: Add dnd-kit imports and a sortable row component**

At the top of `index.tsx`, add:

```ts
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
```

Inside `SongDetailPage` (before the return), add a co-located sortable row component. Define it outside the page component to avoid re-creation on render:

```tsx
function SortableSectionRow({
  instance,
  index,
  viewMode,
  onDelete,
}: {
  instance: SectionInstance;
  index: number;
  viewMode: ViewMode;
  onDelete: (id: string) => void;
}) {
  const { ref, isDragging } = useSortable({ id: instance.id, index });
  const { t } = useTranslation("songs");

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className="relative group">
      <SectionCard
        instance={instance}
        viewMode={viewMode}
        dragging={isDragging}
      />
      <button
        type="button"
        title={t("Remove section")}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs px-2 py-0.5 rounded"
        onClick={() => onDelete(instance.id)}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Remove native drag state and wire `DragDropProvider`**

In `SongDetailPage`, remove:
```ts
// Delete these two lines:
const [dragOverId, setDragOverId] = useState<string | null>(null);
const draggingId = useRef<string | null>(null);
```

Remove the `handleDrop` function entirely:
```ts
// Delete:
function handleDrop(targetId: string) {
  const sourceId = draggingId.current;
  if (!sourceId || sourceId === targetId) {
    draggingId.current = null;
    setDragOverId(null);
    return;
  }
  const ids = instances.map(i => i.id);
  const from = ids.indexOf(sourceId);
  const to = ids.indexOf(targetId);
  if (from === -1 || to === -1) return;
  const reordered = [...ids];
  reordered.splice(from, 1);
  reordered.splice(to, 0, sourceId);
  reorderInstances.mutate({ songId: song.id, orderedIds: reordered });
  draggingId.current = null;
  setDragOverId(null);
}
```

Replace the section list JSX. Old:

```tsx
<div className="space-y-3">
  {instances.map(instance => (
    <div
      key={instance.id}
      className={[
        "relative group",
        dragOverId === instance.id ? "ring-2 ring-primary rounded-lg" : "",
      ].join(" ")}
    >
      <SectionCard
        instance={instance as SectionInstance}
        viewMode={viewMode}
        dragging={draggingId.current === instance.id}
        onDragStart={() => { draggingId.current = instance.id; }}
        onDragOver={() => setDragOverId(instance.id)}
        onDrop={() => handleDrop(instance.id)}
      />
      <button
        type="button"
        title={t("Remove section")}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs px-2 py-0.5 rounded"
        onClick={() => setDeletingId(instance.id)}
      >
        ✕
      </button>
    </div>
  ))}
</div>
```

New:

```tsx
<DragDropProvider
  onDragEnd={(event) => {
    if (event.canceled) return;
    const reordered = move(instances, event);
    reorderInstances.mutate({
      songId: song.id,
      orderedIds: reordered.map(i => i.id),
    });
  }}
>
  <div className="space-y-3">
    {instances.map((instance, index) => (
      <SortableSectionRow
        key={instance.id}
        instance={instance as SectionInstance}
        index={index}
        viewMode={viewMode}
        onDelete={setDeletingId}
      />
    ))}
  </div>
</DragDropProvider>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm --filter @echo/web tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual test — song part reorder**

Open a song's detail page, drag a section card up and down, confirm:
- Items animate during drag.
- Releasing re-orders the list.
- Order persists after page reload.

- [ ] **Step 6: Commit**

```bash
git add \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/index.tsx \
  apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/-section-card.tsx
git commit -m "feat(songs): replace native drag with @dnd-kit/react for section reordering"
```
