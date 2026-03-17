# Quickstart: Drag & Drop Files to Timeline Tracks

**Branch**: `002-dnd-file-to-track`

## What's changing

A single file is modified: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/-timeline.tsx`

No migrations, no new packages, no backend changes.

## How to test manually

1. Start the dev server: `pnpm dev`
2. Open a song in the DAW (must have at least one track)
3. Open your OS file manager alongside the browser window
4. Drag a `.wav`, `.mp3`, or `.mid` file over the timeline canvas
5. **Verify**:
   - A ghost clip appears on the track lane you're hovering
   - The ghost snaps to 1/4-measure grid as you move horizontally
   - Moving vertically switches the ghost to the correct track lane
   - A subtle ring/border appears on the timeline container
   - Releasing the mouse triggers the upload; the ghost is replaced by a real clip
   - Dragging outside the timeline removes all indicators
   - Dragging a `.pdf` or `.txt` file produces no ghost

## Key constants (unchanged)

```
PIXELS_PER_MEASURE = 120   → pixels per measure in the timeline
TRACK_HEIGHT       = 64    → height of each track lane in px
RULER_HEIGHT       = 32    → height of the ruler at the top
```

## Ghost clip measure formula

```
pixelX       = e.clientX - containerRect.left + container.scrollLeft
startMeasure = Math.max(1, Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4)
```

## Track index formula

```
trackIndex = clamp(
  Math.floor((e.clientY - containerRect.top - RULER_HEIGHT) / TRACK_HEIGHT),
  0,
  tracks.length - 1
)
```
