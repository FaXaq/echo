# Song-Part Length Editing

**Date:** 2026-04-12
**Branch:** 001-daw-enhancements

## Context

Section instances (`SongSectionInstance`) have a `lengthMeasures` field that is already persisted and served via `instance.update`, but the UI exposes no way to change it. The structure lane in the DAW renders sections as read-only coloured blocks (`pointer-events-none`), and the section card on the song page shows length as a plain text badge. This spec adds editing in both surfaces.

---

## Feature Summary

1. **DAW — drag to resize:** drag the right edge of a section block to change `lengthMeasures`. Following sections are ripple-shifted right. Snaps to 0.25-measure grid.
2. **DAW — timeline zoom:** a slider + +/− buttons in the toolbar (plus Cmd/Ctrl + scroll wheel) control `pixelsPerMeasure`, enabling precise drag at high zoom.
3. **Song page — inline edit:** clicking the "Xm" badge on a section card turns it into a number input; Enter/blur saves, Escape cancels.

---

## 1. Zoom State

### Change

Convert `PIXELS_PER_MEASURE` from a module-level constant to DawContext state.

**`-daw-context.tsx`** — add to `DawContextValue`:
```ts
pixelsPerMeasure: number          // default 120
setPixelsPerMeasure: (v: number) => void
```

Range: 40–480. Default: 120 (preserving current behaviour).

### Consumers to update

| File | Change |
|------|--------|
| `-daw-structure-lane.tsx` | Read `pixelsPerMeasure` from context instead of import |
| `-timeline.tsx` | Read from context; add zoom controls and wheel handler |
| `-audio-clip-view.tsx` | Read from context instead of import |
| `-clip-utils.ts` | Add `pixelsPerMeasure` parameter to `computeSnappedMeasure` and `computeClipWidthPx`; remove constant import |

The constant in `-constants.ts` stays as the default value reference; it is no longer imported by runtime code.

### Zoom controls (in timeline toolbar)

- `<Slider>` (shadcn) min=40 max=480, value bound to `pixelsPerMeasure`
- `−` / `+` buttons stepping through fixed levels: `[40, 60, 80, 120, 160, 240, 360, 480]`
- `onWheel` on the timeline scroll container: when `e.ctrlKey || e.metaKey`, call `e.preventDefault()` and zoom; otherwise let scroll pass through

---

## 2. Structure Lane Resize

### Resize handle

Each section block in `-daw-structure-lane.tsx` gets an 8px right-edge overlay with `cursor: ew-resize` and `onMouseDown` → `onResizeStart`. The rest of the block remains non-interactive for now (no click-to-select). Remove `pointer-events-none` from the lane container.

### Hook: `hooks/use-structure-lane-resize.ts`

The hook accepts a `scrollContainerRef: React.RefObject<HTMLElement>` (the same ref the timeline passes to clip-drag hooks) so it can read live `scrollLeft` during drag.

```ts
interface DragState {
  instanceId: string
  startX: number
  originalLength: number
  capturedScrollLeft: number
}

// Returns
{
  optimisticInstances: SectionInstanceWithDefinition[] | null  // null when not dragging
  onResizeStart: (e: React.MouseEvent, instance: SectionInstanceWithDefinition) => void
  isDragging: boolean
}
```

**`onResizeStart`**
- Record `startX`, `originalLength`, `capturedScrollLeft` (from the timeline scroll container ref)
- Attach `mousemove` and `mouseup` to `document`

**`mousemove`**
```
dx = e.clientX - startX + scrollLeft - capturedScrollLeft
newLength = Math.max(0.25, Math.round((originalLength + dx / pixelsPerMeasure) * 4) / 4)
```
Ripple: sort all instances by `startMeasure`. For the dragged instance, set `lengthMeasures = newLength`. For each subsequent instance, set `startMeasure = prevInstance.startMeasure + prevInstance.lengthMeasures`. Set `optimisticInstances` to the rebuilt array.

**`mouseup`**
- Diff optimistic vs original: collect all instances whose `lengthMeasures` or `startMeasure` changed
- Fire `instance.update` for each changed instance (parallel mutations)
- Clear drag state and `optimisticInstances`

### Structure lane rendering

```ts
const displayInstances = optimisticInstances ?? serverInstances
```

### Timeline width

Add section endpoints to the `totalMeasures` calculation in `-timeline.tsx`:
```ts
const lastSectionEnd = instances.reduce(
  (max, i) => Math.max(max, i.startMeasure - 1 + i.lengthMeasures),
  0,
)
// include lastSectionEnd in the existing Math.max(...) call
```

---

## 3. Song Page Inline Edit

**File:** `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-section-card.tsx`

Replace the read-only length badge with a click-to-edit control:

```tsx
// Before
<span className="text-xs text-muted-foreground ml-auto">
  {t("{{count}}m", { count: instance.lengthMeasures })}
</span>

// After (conceptual)
{editingLength ? (
  <input
    type="number"
    min={0.25}
    step={0.25}
    defaultValue={instance.lengthMeasures}
    autoFocus
    onBlur={handleLengthSave}
    onKeyDown={handleLengthKeyDown}  // Enter → save, Escape → cancel
    className="..."
  />
) : (
  <span
    className="text-xs text-muted-foreground ml-auto cursor-pointer hover:text-foreground"
    onClick={() => setEditingLength(true)}
  >
    {t("{{count}}m", { count: instance.lengthMeasures })}
  </span>
)}
```

- `editingLength: boolean` is local state in the card component
- On save: call `trpc.organization.song.section.instance.update.useMutation()` (already available in the card) with `{ id: instance.id, lengthMeasures: value }`
- Validation: clamp to `Math.max(0.25, value)` before saving

---

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/routes/.../daw/-daw-context.tsx` | Add `pixelsPerMeasure`, `setPixelsPerMeasure` |
| `apps/web/src/routes/.../daw/-daw.tsx` | Wire `pixelsPerMeasure` state into DawProvider |
| `apps/web/src/routes/.../daw/-timeline.tsx` | Use context zoom; add zoom controls + wheel handler; include section endpoints in `totalMeasures` |
| `apps/web/src/routes/.../daw/-daw-structure-lane.tsx` | Remove `pointer-events-none`; add resize handles; use context zoom; render from `optimisticInstances ?? serverInstances` |
| `apps/web/src/routes/.../daw/-clip-utils.ts` | Add `pixelsPerMeasure` param to affected functions |
| `apps/web/src/routes/.../daw/hooks/-use-clip-drag.ts` | Pass `pixelsPerMeasure` when calling updated `computeSnappedMeasure` |
| `apps/web/src/routes/.../daw/-audio-clip-view.tsx` | Read `pixelsPerMeasure` from context |
| `apps/web/src/routes/.../daw/hooks/use-structure-lane-resize.ts` | New hook |
| `apps/web/src/routes/.../songs/$songSlug/-section-card.tsx` | Inline length edit |

No backend changes — `instance.update` already accepts `lengthMeasures` and `startMeasure`.

---

## Verification

1. **Zoom:** Open DAW → drag slider → confirm clip and section blocks scale together → use Cmd+scroll → confirm zoom responds
2. **Resize in DAW:** Hover right edge of a section block → cursor changes to `ew-resize` → drag right → confirm block widens and subsequent sections shift → release → reload page → confirm persisted
3. **Sub-measure precision:** At high zoom, drag to a non-integer length → confirm snaps to 0.25 grid
4. **Song page edit:** Open song page → click "Xm" badge → type new value → Enter → confirm badge updates → reload → confirm persisted
5. **Escape cancel:** Click badge, change value, press Escape → confirm reverts to original
