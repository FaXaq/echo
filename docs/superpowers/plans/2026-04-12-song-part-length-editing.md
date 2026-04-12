# Song-Part Length Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users resize section blocks by dragging in the DAW (with ripple and zoom) and edit length inline on the song page.

**Architecture:** `pixelsPerMeasure` moves from a hardcoded constant into DawContext so zoom state is shared across all timeline components. A new `useStructureLaneResize` hook owns drag state and fires batch mutations on mouseup. The song page gets a local `editingLength` state on the section card.

**Tech Stack:** React 18, TypeScript, tRPC, shadcn/ui Button, Tailwind CSS v4, Vitest

---

## File Map

| File | Change |
|------|--------|
| `-daw-context.tsx` | Add `pixelsPerMeasure`, `setPixelsPerMeasure` to interface |
| `-daw.tsx` | Add `pixelsPerMeasure` state, wire into DawContext.Provider |
| `-clip-utils.ts` | Add `pixelsPerMeasure` param to `computeGhostPosition`, `computeSnappedMeasure`, `computeClipWidthPx` |
| `-clip-utils.test.ts` | Pass `120` as `pixelsPerMeasure` to updated function calls |
| `hooks/-use-clip-drag.ts` | Read `pixelsPerMeasure` from context, pass to `computeSnappedMeasure` |
| `hooks/-use-clip-selection.ts` | Read `pixelsPerMeasure` from context, replace constant usages |
| `hooks/-use-file-drop.ts` | Read `pixelsPerMeasure` from context, pass to `computeGhostPosition` |
| `-daw-ruler.tsx` | Read `pixelsPerMeasure` from context |
| `-daw-track-row.tsx` | Read `pixelsPerMeasure` from context |
| `-audio-clip-view.tsx` | Read `pixelsPerMeasure` from context, pass to `computeClipWidthPx` |
| `-midi-clip-view.tsx` | Read `pixelsPerMeasure` from context, pass to `computeClipWidthPx` |
| `-daw-drag-ghost.tsx` | Read `pixelsPerMeasure` from context |
| `-timeline.tsx` | Read from context; add zoom controls + wheel handler; update `totalMeasures` to include sections |
| `-daw-structure-lane.tsx` | Remove `pointer-events-none`; add resize handles; render from `optimisticInstances ?? serverInstances` |
| `hooks/use-structure-lane-resize.ts` | New hook |
| `songs/$songSlug/-section-card.tsx` | Inline length edit on click |

---

## Task 1: Extend DawContext with pixelsPerMeasure

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-daw-context.tsx`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-daw.tsx`

- [ ] **Step 1: Add fields to DawContextValue**

In `-daw-context.tsx`, add after the `undo/redo` fields (line 77, before the closing `}`):

```typescript
  // Zoom
  pixelsPerMeasure: number;
  setPixelsPerMeasure: React.Dispatch<React.SetStateAction<number>>;
```

Full updated interface tail:
```typescript
  // Undo/redo
  pushHistory: (apiUndo: () => void) => void;
  undo: () => void;
  redo: () => void;

  // Zoom
  pixelsPerMeasure: number;
  setPixelsPerMeasure: React.Dispatch<React.SetStateAction<number>>;
}
```

- [ ] **Step 2: Add state in DawProvider**

In `-daw.tsx`, add import at the top and state in `DawProvider`:

```typescript
import { PIXELS_PER_MEASURE } from "./-constants";
```

(This import may already exist; if not, add it.)

After the existing `useState` declarations (after line 48):
```typescript
  const [pixelsPerMeasure, setPixelsPerMeasure] = useState<number>(PIXELS_PER_MEASURE);
```

- [ ] **Step 3: Wire into context value**

In the `DawContext.Provider value={{...}}` block (around line 178), add after `redo`:
```typescript
        pixelsPerMeasure,
        setPixelsPerMeasure,
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/perso/Documents/perso/echo
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no new errors related to `pixelsPerMeasure`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-daw-context.tsx \
        apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-daw.tsx
git commit -m "feat(daw): add pixelsPerMeasure to DawContext"
```

---

## Task 2: Refactor clip-utils.ts to accept pixelsPerMeasure

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-clip-utils.ts`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-clip-utils.test.ts`

- [ ] **Step 1: Update computeGhostPosition**

Replace the function signature and body (lines 20–36):

```typescript
export function computeGhostPosition(
  e: React.DragEvent<HTMLDivElement>,
  container: HTMLDivElement,
  tracks: Track[],
  pixelsPerMeasure: number,
): { trackIndex: number; startMeasure: number } | null {
  if (tracks.length === 0) return null;
  const rect = container.getBoundingClientRect();
  const pixelY = e.clientY - rect.top;
  if (pixelY < RULER_HEIGHT) return null;
  const pixelX = e.clientX - rect.left + container.scrollLeft;
  const startMeasure = Math.max(1, Math.round((pixelX / pixelsPerMeasure) * 4) / 4);
  const trackIndex = Math.max(
    0,
    Math.min(tracks.length - 1, Math.floor((pixelY - RULER_HEIGHT) / TRACK_HEIGHT)),
  );
  return { trackIndex, startMeasure };
}
```

- [ ] **Step 2: Update computeSnappedMeasure**

Replace the function (lines 69–78):

```typescript
export function computeSnappedMeasure(
  mouseX: number,
  scrollLeft: number,
  startX: number,
  initialScrollLeft: number,
  originalMeasure: number,
  pixelsPerMeasure: number,
): number {
  const dx = mouseX - startX + scrollLeft - initialScrollLeft;
  return Math.round(Math.max(1, originalMeasure + dx / pixelsPerMeasure) * 4) / 4;
}
```

- [ ] **Step 3: Update computeClipWidthPx**

Replace the function (lines 83–93):

```typescript
export function computeClipWidthPx(
  durationMs: number | undefined,
  secondsPerMeasure: number,
  pixelsPerMeasure: number,
): number {
  return Math.max(
    pixelsPerMeasure,
    durationMs != null
      ? (durationMs / 1000 / secondsPerMeasure) * pixelsPerMeasure
      : pixelsPerMeasure,
  );
}
```

- [ ] **Step 4: Remove PIXELS_PER_MEASURE import from clip-utils.ts**

Change line 6:
```typescript
import { RULER_HEIGHT, TRACK_HEIGHT } from "./-constants";
```

- [ ] **Step 5: Update tests**

In `-clip-utils.test.ts`, remove `PIXELS_PER_MEASURE` import (line 3) and update the `computeClipWidthPx` suite:

```typescript
import { describe, it, expect } from "vitest";
import { stripExtension, computeOverlaps, computeClipWidthPx } from "./-clip-utils";

// ... stripExtension and computeOverlaps suites unchanged ...

describe("computeClipWidthPx", () => {
  const secondsPerMeasure = 2; // 120 bpm, 4/4
  const ppm = 120;

  it("returns pixelsPerMeasure minimum when durationMs is undefined", () => {
    expect(computeClipWidthPx(undefined, secondsPerMeasure, ppm)).toBe(120);
  });

  it("computes correct width for a clip of exactly one measure duration", () => {
    const oneMeasureMs = secondsPerMeasure * 1000;
    expect(computeClipWidthPx(oneMeasureMs, secondsPerMeasure, ppm)).toBe(120);
  });

  it("computes correct width for a two-measure clip", () => {
    const twoMeasuresMs = secondsPerMeasure * 2 * 1000;
    expect(computeClipWidthPx(twoMeasuresMs, secondsPerMeasure, ppm)).toBe(240);
  });

  it("never returns less than pixelsPerMeasure even for a very short clip", () => {
    expect(computeClipWidthPx(1, secondsPerMeasure, ppm)).toBe(120);
  });

  it("scales correctly at double zoom (240 ppm)", () => {
    const twoMeasuresMs = secondsPerMeasure * 2 * 1000;
    expect(computeClipWidthPx(twoMeasuresMs, secondsPerMeasure, 240)).toBe(480);
  });
});
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/perso/Documents/perso/echo
pnpm --filter @echo/web test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|clip-utils)"
```

Expected: all clip-utils tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-clip-utils.ts \
        apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-clip-utils.test.ts
git commit -m "refactor(daw): add pixelsPerMeasure param to clip-utils pure functions"
```

---

## Task 3: Update hooks to use pixelsPerMeasure from context

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/hooks/-use-clip-drag.ts`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/hooks/-use-clip-selection.ts`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/hooks/-use-file-drop.ts`

- [ ] **Step 1: Update -use-clip-drag.ts**

Add import at the top:
```typescript
import { useDawContext } from "../-daw-context";
```

Inside `useClipDrag`, before the `draggingAudioRef` declaration, add:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

The `computeMeasure` helper inside `handleMouseDown` (audio, line ~155) currently calls:
```typescript
computeSnappedMeasure(mouseX, scrollLeft, draggingAudioRef.current!.startX, draggingAudioRef.current!.initialScrollLeft, draggingAudioRef.current!.originalMeasure)
```
Add `pixelsPerMeasure` as the last argument in both `computeMeasure` definitions (audio and midi):
```typescript
const computeMeasure = (mouseX: number, scrollLeft: number) =>
  computeSnappedMeasure(mouseX, scrollLeft, draggingAudioRef.current!.startX, draggingAudioRef.current!.initialScrollLeft, draggingAudioRef.current!.originalMeasure, pixelsPerMeasure);
```

Add `pixelsPerMeasure` to the deps arrays of both `handleMouseDown` and `handleMidiMouseDown` useCallbacks.

- [ ] **Step 2: Update -use-clip-selection.ts**

Add import at the top:
```typescript
import { useDawContext } from "../-daw-context";
```

Inside `useClipSelection`, add before the `selectionRect` state:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Replace all 4 occurrences of `PIXELS_PER_MEASURE` with `pixelsPerMeasure` (lines 73, 75, 85, 87).

Remove `PIXELS_PER_MEASURE` from the import at line 3:
```typescript
import { TRACK_HEIGHT, RULER_HEIGHT } from "../-constants";
```

- [ ] **Step 3: Update -use-file-drop.ts**

Add import at the top:
```typescript
import { useDawContext } from "../-daw-context";
```

Inside `useFileDrop`, add before the state declarations:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Find the call to `computeGhostPosition` (it passes `e`, `containerRef.current`, `tracks`) and add `pixelsPerMeasure` as the 4th argument:
```typescript
const pos = computeGhostPosition(e, containerRef.current, tracks, pixelsPerMeasure);
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/hooks/
git commit -m "refactor(daw): pass pixelsPerMeasure from context to drag/selection/drop hooks"
```

---

## Task 4: Update rendering components to use pixelsPerMeasure from context

**Files:**
- Modify: `-daw-ruler.tsx`, `-daw-track-row.tsx`, `-audio-clip-view.tsx`, `-midi-clip-view.tsx`, `-daw-drag-ghost.tsx`, `-timeline.tsx`, `-daw-structure-lane.tsx`

All of these currently import `PIXELS_PER_MEASURE` from `./-constants`. Each change follows the same pattern: add/extend `useDawContext()` call, replace constant usages.

- [ ] **Step 1: Update -daw-ruler.tsx**

Add import:
```typescript
import { useDawContext } from "./-daw-context";
```

Remove `PIXELS_PER_MEASURE` from constants import (keep `RULER_HEIGHT`).

Inside `DawRuler`, add:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Replace both `PIXELS_PER_MEASURE` usages (lines 14 and 21) with `pixelsPerMeasure`.

Full updated file:
```typescript
import { RULER_HEIGHT } from "./-constants";
import { useDawContext } from "./-daw-context";

interface DawRulerProps {
  totalMeasures: number;
}

export function DawRuler({ totalMeasures }: DawRulerProps) {
  const { pixelsPerMeasure } = useDawContext();

  return (
    <div className="flex bg-muted border-b" style={{ height: RULER_HEIGHT }}>
      {Array.from({ length: totalMeasures }, (_, i) => (
        <div
          key={i}
          className="relative border-r border-border flex items-center px-1 shrink-0"
          style={{ width: pixelsPerMeasure }}
        >
          <span className="text-xs text-muted-foreground">{i + 1}</span>
          {[1, 2, 3].map((q) => (
            <div
              key={q}
              className="absolute top-0 bottom-0 border-r border-border/20"
              style={{ left: q * (pixelsPerMeasure / 4) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update -daw-track-row.tsx**

Remove `PIXELS_PER_MEASURE` from import (line 10), keep `TRACK_HEIGHT`.

In the existing `useDawContext()` destructure (line 50), add `pixelsPerMeasure`:
```typescript
  const { clips, midiClips, downloadUrls, selection, pixelsPerMeasure } = useDawContext();
```

Replace all 8 occurrences of `PIXELS_PER_MEASURE` with `pixelsPerMeasure` (lines 74, 89, 142, 144, 146, 147, 151, 153, 155, 156).

- [ ] **Step 3: Update -audio-clip-view.tsx**

Add import:
```typescript
import { useDawContext } from "./-daw-context";
```

Remove `PIXELS_PER_MEASURE` from constants import (line 21).

Inside `AudioClipView`, add:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Update the `computeClipWidthPx` call (around line 117) to pass `pixelsPerMeasure` as 3rd arg:
```typescript
const clipWidth = computeClipWidthPx(clip.durationMs, secondsPerMeasure, pixelsPerMeasure);
```

Replace the `left` style calculation (line 129):
```typescript
left: (clip.startMeasure - 1) * pixelsPerMeasure,
```

- [ ] **Step 4: Update -midi-clip-view.tsx**

Same pattern as audio:

Add import:
```typescript
import { useDawContext } from "./-daw-context";
```

Remove `PIXELS_PER_MEASURE` from constants import.

Inside `MidiClipView`, add:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Update `computeClipWidthPx` call to pass `pixelsPerMeasure` as 3rd arg.

Replace `left` style (line 107):
```typescript
left: (clip.startMeasure - 1) * pixelsPerMeasure,
```

- [ ] **Step 5: Update -daw-drag-ghost.tsx**

In the existing `useDawContext()` call (line 18), add `pixelsPerMeasure`:
```typescript
  const { bpm, pixelsPerMeasure } = useDawContext();
```

Remove `PIXELS_PER_MEASURE` from constants import (keep `TRACK_HEIGHT`, `RULER_HEIGHT`).

Replace both `PIXELS_PER_MEASURE` usages (lines 24–25 and 42):
```typescript
const ghostWidth = durationMs
  ? Math.max(pixelsPerMeasure, (durationMs / 1000 / secondsPerMeasure) * pixelsPerMeasure)
  : pixelsPerMeasure * 2;
// ...
left: (dragGhost.startMeasure - 1) * pixelsPerMeasure,
```

- [ ] **Step 6: Update -daw-structure-lane.tsx**

Add import:
```typescript
import { useDawContext } from "./-daw-context";
```

Remove `PIXELS_PER_MEASURE` from constants import (keep `STRUCTURE_LANE_HEIGHT`).

Inside `DawStructureLane`, add:
```typescript
  const { pixelsPerMeasure } = useDawContext();
```

Replace `PIXELS_PER_MEASURE` in lines 54–55:
```typescript
const leftPx = (instance.startMeasure - 1) * pixelsPerMeasure;
const widthPx = instance.lengthMeasures * pixelsPerMeasure;
```

- [ ] **Step 7: Update -timeline.tsx**

Remove `PIXELS_PER_MEASURE` from the constants import at line 5 (keep the other constants).

In the `useDawContext()` destructure (line 29–54 block), add:
```typescript
    pixelsPerMeasure,
    setPixelsPerMeasure,
```

Replace `PIXELS_PER_MEASURE` in `totalWidth` (line 249):
```typescript
const totalWidth = totalMeasures * pixelsPerMeasure;
```

Replace `PIXELS_PER_MEASURE` in the playback cursor style (line 347):
```typescript
style={{ left: playbackPosition * pixelsPerMeasure }}
```

- [ ] **Step 8: TypeScript check and tests**

```bash
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
pnpm --filter @echo/web test 2>&1 | grep -E "(PASS|FAIL|✓|✗)"
```

Expected: clean compile, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/
git commit -m "refactor(daw): all timeline components read pixelsPerMeasure from DawContext"
```

---

## Task 5: Add zoom controls to Timeline

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-constants.ts`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-timeline.tsx`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-daw.tsx`

- [ ] **Step 1: Add ZOOM_LEVELS helpers to -constants.ts**

`DawInner` (the toolbar component) lives in `-daw.tsx` and `Timeline` (the wheel handler) lives in `-timeline.tsx`. Both need the zoom helpers, so put them in `-constants.ts`:

Append to the end of `-constants.ts`:
```typescript
export const ZOOM_LEVELS = [40, 60, 80, 120, 160, 240, 360, 480] as const;

export function zoomIn(current: number): number {
  const next = ZOOM_LEVELS.find((l) => l > current);
  return next ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
}

export function zoomOut(current: number): number {
  const prev = [...ZOOM_LEVELS].reverse().find((l) => l < current);
  return prev ?? ZOOM_LEVELS[0];
}
```

- [ ] **Step 2: Add wheel zoom via non-passive listener**

In `-timeline.tsx`, add `ZOOM_LEVELS`, `zoomIn`, `zoomOut` to the constants import:
```typescript
import {
  PIXELS_PER_MEASURE,  // kept temporarily; removed in Task 4
  TRACK_HEIGHT,
  RULER_HEIGHT,
  MIN_MEASURES,
  BUFFER_MEASURES,
  LEFT_PANEL_WIDTH,
  ZOOM_LEVELS,
  zoomIn,
  zoomOut,
} from "./-constants";
```

Inside `Timeline`, after the existing refs (after line 63), add a `useEffect` that attaches a non-passive wheel listener to `containerRef`:

```typescript
  // Zoom via Ctrl/Cmd + scroll wheel (non-passive so preventDefault works)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setPixelsPerMeasure((prev) => (e.deltaY < 0 ? zoomIn(prev) : zoomOut(prev)));
    };
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [setPixelsPerMeasure]);
```

(Add `useEffect` to the import from "react" if not already present — it is on line 1.)

- [ ] **Step 3: Add zoom controls to the toolbar in -daw.tsx**

In `-daw.tsx`, add imports:
```typescript
import { ZOOM_LEVELS, zoomIn, zoomOut } from "./-constants";
```

In `DawInner` (the component that renders the toolbar with Play/Stop/Export buttons), add the zoom controls. Locate the `<div className="flex gap-2">` around line 260 and extend it:

```tsx
<div className="flex items-center gap-2">
  {/* Zoom controls */}
  <div className="flex items-center gap-1 border rounded px-2 py-1">
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground text-sm w-5 h-5 flex items-center justify-center"
      onClick={() => setPixelsPerMeasure(zoomOut(pixelsPerMeasure))}
      disabled={pixelsPerMeasure <= ZOOM_LEVELS[0]}
      title="Zoom out"
    >
      −
    </button>
    <input
      type="range"
      min={40}
      max={480}
      step={1}
      value={pixelsPerMeasure}
      onChange={(e) => setPixelsPerMeasure(Number(e.target.value))}
      className="w-20 accent-primary"
      title={`Zoom: ${pixelsPerMeasure}px/measure`}
    />
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground text-sm w-5 h-5 flex items-center justify-center"
      onClick={() => setPixelsPerMeasure(zoomIn(pixelsPerMeasure))}
      disabled={pixelsPerMeasure >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
      title="Zoom in"
    >
      +
    </button>
  </div>

  {/* Existing Play / Stop / Export buttons */}
  <Button variant="outline" size="sm" onClick={onPlay} disabled={isPlaying || isExporting}>
    <Trans t={t}>Play</Trans>
  </Button>
  {/* ... rest unchanged ... */}
</div>
```

`DawInner` accesses `useDawContext()`. Extend its destructure to include `pixelsPerMeasure` and `setPixelsPerMeasure`:
```typescript
  const {
    isPlaying, isExporting, pendingMultiDrop, setPendingMultiDrop,
    onImportUseExistingTracks, onImportCreateNewTracks,
    onPlay, onStop, onExport,
    pixelsPerMeasure, setPixelsPerMeasure,
  } = useDawContext();
```

`ZOOM_LEVELS` and helper functions are module-level, so `DawInner` can use them directly.

- [ ] **Step 4: Verify zoom works in the browser**

```bash
pnpm dev
```

Open the DAW. Move the slider — all clips and sections should scale. Use Ctrl+scroll — should zoom step through levels.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-timeline.tsx
git commit -m "feat(daw): add zoom slider and Ctrl+scroll zoom to timeline"
```

---

## Task 6: Create useStructureLaneResize hook

**Files:**
- Create: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/hooks/use-structure-lane-resize.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useRef, useCallback } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useDawContext } from "../-daw-context";
import type { SectionInstanceWithDefinition } from "../-daw-structure-lane";

interface UseStructureLaneResizeDeps {
  instances: SectionInstanceWithDefinition[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  songId: string;
}

interface DragState {
  instanceId: string;
  startX: number;
  capturedScrollLeft: number;
  originalLength: number;
}

function rebuildWithRipple(
  sorted: SectionInstanceWithDefinition[],
  instanceId: string,
  newLength: number,
): SectionInstanceWithDefinition[] {
  const idx = sorted.findIndex((i) => i.id === instanceId);
  if (idx === -1) return sorted;
  const updated = [...sorted];
  updated[idx] = { ...updated[idx], lengthMeasures: newLength };
  for (let i = idx + 1; i < updated.length; i++) {
    updated[i] = {
      ...updated[i],
      startMeasure: updated[i - 1].startMeasure + updated[i - 1].lengthMeasures,
    };
  }
  return updated;
}

export function useStructureLaneResize({
  instances,
  scrollContainerRef,
  songId,
}: UseStructureLaneResizeDeps) {
  const { pixelsPerMeasure } = useDawContext();
  const utils = trpc.useUtils();

  const [optimisticInstances, setOptimisticInstances] = useState<SectionInstanceWithDefinition[] | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const originalInstancesRef = useRef<SectionInstanceWithDefinition[]>([]);
  const optimisticRef = useRef<SectionInstanceWithDefinition[] | null>(null);

  // Keep ref in sync for access inside event handlers
  optimisticRef.current = optimisticInstances;

  const updateInstance = trpc.organization.song.section.instance.update.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId }),
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const { instanceId, startX, capturedScrollLeft, originalLength } = dragStateRef.current;
      const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const dx = e.clientX - startX + currentScrollLeft - capturedScrollLeft;
      const newLength = Math.max(0.25, Math.round((originalLength + dx / pixelsPerMeasure) * 4) / 4);
      const sorted = [...originalInstancesRef.current].sort((a, b) => a.startMeasure - b.startMeasure);
      const next = rebuildWithRipple(sorted, instanceId, newLength);
      optimisticRef.current = next;
      setOptimisticInstances(next);
    },
    [pixelsPerMeasure, scrollContainerRef],
  );

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current) return;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    const optimistic = optimisticRef.current;
    const original = originalInstancesRef.current;

    if (optimistic) {
      optimistic.forEach((opt) => {
        const orig = original.find((o) => o.id === opt.id);
        if (
          orig &&
          (opt.lengthMeasures !== orig.lengthMeasures || opt.startMeasure !== orig.startMeasure)
        ) {
          updateInstance.mutate({
            id: opt.id,
            lengthMeasures: opt.lengthMeasures,
            startMeasure: opt.startMeasure,
          });
        }
      });
    }

    dragStateRef.current = null;
    optimisticRef.current = null;
    setOptimisticInstances(null);
  }, [handleMouseMove, updateInstance]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, instance: SectionInstanceWithDefinition) => {
      e.preventDefault();
      e.stopPropagation();
      originalInstancesRef.current = [...instances];
      dragStateRef.current = {
        instanceId: instance.id,
        startX: e.clientX,
        capturedScrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
        originalLength: instance.lengthMeasures,
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [instances, scrollContainerRef, handleMouseMove, handleMouseUp],
  );

  return {
    optimisticInstances,
    onResizeStart,
  };
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/hooks/use-structure-lane-resize.ts
git commit -m "feat(daw): add useStructureLaneResize hook with ripple edit"
```

---

## Task 7: Wire resize into structure lane and timeline

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-daw-structure-lane.tsx`
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-timeline.tsx`

- [ ] **Step 1: Update DawStructureLane props and render**

Update the props interface in `-daw-structure-lane.tsx`:

```typescript
interface DawStructureLaneProps {
  instances: SectionInstanceWithDefinition[];
  totalWidth: number;
  onResizeStart: (e: React.MouseEvent, instance: SectionInstanceWithDefinition) => void;
}
```

Update the function signature:
```typescript
export function DawStructureLane({ instances, totalWidth, onResizeStart }: DawStructureLaneProps) {
```

Inside the map, replace the block `div` (currently at line 64):

```tsx
return (
  <div
    key={instance.id}
    className="absolute inset-y-1 rounded flex flex-col justify-center px-2 overflow-hidden"
    style={{
      left: leftPx,
      width: widthPx - 2,
      backgroundColor: `${color}33`,
      borderLeft: `3px solid ${color}`,
    }}
  >
    {/* Content (non-interactive) */}
    <span className="text-xs font-medium leading-none truncate pointer-events-none" style={{ color }}>
      {instance.definition.name}
    </span>
    {showChords && (
      <span className="text-xs leading-none truncate text-muted-foreground mt-0.5 font-mono pointer-events-none">
        {chordLine}
      </span>
    )}
    {/* Resize handle */}
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
      onMouseDown={(e) => onResizeStart(e, instance)}
    />
  </div>
);
```

Note: removed `pointer-events-none` from the outer div. Added it to text spans. Added the resize handle.

- [ ] **Step 2: Wire resize hook in Timeline**

In `-timeline.tsx`, add the import:
```typescript
import { useStructureLaneResize } from "./hooks/use-structure-lane-resize";
```

After the `structureInstances` declaration (line 59), add:

```typescript
  const { optimisticInstances, onResizeStart } = useStructureLaneResize({
    instances: structureInstances,
    scrollContainerRef: containerRef,
    songId: song.id,
  });
  const displayInstances = optimisticInstances ?? structureInstances;
```

Replace the `totalMeasures` useMemo (lines 237–247) with a version that includes section endpoints and uses `displayInstances`:

```typescript
  const totalMeasures = useMemo(() => {
    const lastAudioEnd = clips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    const lastMidiEnd = midiClips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs ? clip.durationMs / 1000 / secondsPerMeasure : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    const lastSectionEnd = displayInstances.reduce(
      (max, i) => Math.max(max, i.startMeasure - 1 + i.lengthMeasures),
      0,
    );
    return Math.max(
      MIN_MEASURES,
      Math.ceil(Math.max(lastAudioEnd, lastMidiEnd, lastSectionEnd)) + BUFFER_MEASURES,
    );
  }, [clips, midiClips, secondsPerMeasure, displayInstances]);
```

Update the two places that use `structureInstances` for rendering:

1. `DawStructureLaneHeader` prop: stays as `structureInstances.length > 0` (show header when server data has sections)
2. `DawStructureLane` call: change to `displayInstances` and add `onResizeStart`:

```tsx
<DawStructureLane
  instances={displayInstances}
  totalWidth={totalWidth}
  onResizeStart={onResizeStart}
/>
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
```

Expected: clean.

- [ ] **Step 4: Manual smoke test in browser**

```bash
pnpm dev
```

1. Open the DAW for a song that has sections.
2. Hover the right edge of a section block → cursor should be `ew-resize`.
3. Drag right → the block widens, subsequent sections shift right in real time.
4. Release → mutations fire, reload page, lengths are persisted.
5. Drag at 0.5 measure precision → confirm snapping to 0.25 steps.
6. Zoom in with slider → repeat drag at high zoom for finer control.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-daw-structure-lane.tsx \
        apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/daw/-timeline.tsx
git commit -m "feat(daw): drag-to-resize sections with ripple edit in structure lane"
```

---

## Task 8: Song page inline length edit

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-section-card.tsx`

- [ ] **Step 1: Add editingLength state and handlers**

In `SectionCard`, after the existing `useState` declarations (around line 81), add:

```typescript
  const [editingLength, setEditingLength] = useState(false);
  const [lengthInputValue, setLengthInputValue] = useState(String(instance.lengthMeasures));
```

Add two handlers before the `return`:

```typescript
  function saveLengthEdit() {
    const parsed = parseFloat(lengthInputValue);
    const clamped = Math.max(0.25, isNaN(parsed) ? instance.lengthMeasures : parsed);
    if (clamped !== instance.lengthMeasures) {
      updateInstance.mutate({ id: instance.id, lengthMeasures: clamped });
    }
    setEditingLength(false);
  }

  function handleLengthKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") saveLengthEdit();
    if (e.key === "Escape") {
      setLengthInputValue(String(instance.lengthMeasures));
      setEditingLength(false);
    }
  }
```

- [ ] **Step 2: Replace the read-only length badge**

Find the span at line 182–184:
```tsx
<span className="text-xs text-muted-foreground ml-auto">
  {t("{{count}}m", { count: instance.lengthMeasures })}
</span>
```

Replace with:
```tsx
{editingLength ? (
  <input
    type="number"
    min={0.25}
    step={0.25}
    autoFocus
    value={lengthInputValue}
    onChange={(e) => setLengthInputValue(e.target.value)}
    onBlur={saveLengthEdit}
    onKeyDown={handleLengthKeyDown}
    className="text-xs w-16 ml-auto bg-transparent border-b border-muted-foreground outline-none text-right"
  />
) : (
  <span
    className="text-xs text-muted-foreground ml-auto cursor-pointer hover:text-foreground transition-colors"
    title={t("Click to edit length")}
    onClick={() => {
      setLengthInputValue(String(instance.lengthMeasures));
      setEditingLength(true);
    }}
  >
    {t("{{count}}m", { count: instance.lengthMeasures })}
  </span>
)}
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @echo/web exec tsc --noEmit 2>&1 | head -40
```

Expected: clean.

- [ ] **Step 4: Manual smoke test**

```bash
pnpm dev
```

1. Open the song page (not DAW).
2. Click the "8m" badge on a section card → input appears, pre-filled.
3. Change value to `16`, press Enter → badge updates to "16m".
4. Reload → confirm persisted.
5. Click, change, press Escape → reverts to original value.
6. Click, clear to empty, blur → value stays at original (clamped to `instance.lengthMeasures`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_auth-guard/organizations/\$organizationSlug/songs/\$songSlug/-section-card.tsx
git commit -m "feat(songs): inline length edit on section card"
```

---

## Verification Checklist

- [ ] Zoom slider scales all clips + sections + ruler consistently
- [ ] Ctrl/Cmd + scroll zooms (non-passive handler)
- [ ] Drag right edge of section → block widens, following sections shift
- [ ] Sub-measure drag snaps to 0.25 increments (not whole measures)
- [ ] Releasing drag persists all changed `lengthMeasures` and `startMeasure` values
- [ ] Song page length badge: click → edit → Enter saves, Escape cancels
- [ ] All existing tests pass: `pnpm test`
- [ ] TypeScript clean: `pnpm --filter @echo/web exec tsc --noEmit`
