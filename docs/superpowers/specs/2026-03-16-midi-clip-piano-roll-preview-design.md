# MIDI Clip Piano Roll Preview

**Date:** 2026-03-16
**Status:** Approved

## Overview

Add a read-only piano roll preview to `MidiClipView` in the DAW timeline, rendered as a canvas overlay — mirroring the existing waveform visualization on `AudioClipView`.

## Goals

- Show MIDI note content at a glance inside the clip block on the timeline
- Match the visual language and implementation pattern of the audio waveform
- No backend changes, no schema changes, no new tRPC procedures

## Non-Goals

- Interactive piano roll editor (deferred)
- Per-track color coding
- Velocity visualization
- Device pixel ratio (DPR) correction — match the waveform canvas which also skips this

## Scope of Changes

Single file: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-timeline.tsx`

Changes:
1. Add `downloadUrl?: string` to `MidiClipViewProps`
2. Pass `downloadUrls.get(clip.file.storageKey)` at the `<MidiClipView>` call site (line ~607) — `downloadUrls` is already in scope
3. Add `canvasRef`, fetch/parse/render `useEffect`, and `<canvas>` element inside `MidiClipView`
4. Update `-timeline.stories.tsx` to pass a `downloadUrl` prop where `MidiClipView` is exercised

## Design

### Data Flow

1. `MidiClipView` receives `downloadUrl?: string` as a prop (the signed URL for the clip's MIDI file, sourced from the `downloadUrls` map already fetched in the parent)
2. A `useEffect` keyed on `downloadUrl` fetches the file, parses it with `new Midi(arrayBuffer)` from `@tonejs/midi` (already in the project), and draws to canvas
3. Flatten all MIDI tracks' notes into a single array using `midi.tracks.flatMap(t => t.notes)`
4. Derive rendering bounds:
   - `minPitch` / `maxPitch` from `note.midi` — for Y auto-scaling
   - `totalDuration` from `midi.duration` (seconds) — for X scaling

### Rendering

- **Canvas**: absolutely positioned, fills clip block width and height (same as waveform canvas in `AudioClipView`)
- **Note bar color**: `rgba(16, 185, 129, 0.7)` — emerald, matching the clip's existing green theme
- **Y axis**: `note.midi` mapped top-to-bottom (high pitch = top), auto-scaled to `[minPitch, maxPitch]`
- **X axis**: `note.time` (seconds) and `note.duration` (seconds) — both from `@tonejs/midi`'s `Note` type — mapped proportionally to canvas width using `totalDuration`
- **Minimums**: 1px height per note bar, 1px width per note bar
- **Background**: transparent — clip's existing `bg-emerald-500/20` shows through

### Edge Cases

- **No notes / empty MIDI**: if `notes.length === 0`, return early without drawing
- **`totalDuration === 0`**: if `midi.duration === 0`, return early without drawing
- **`minPitch === maxPitch`** (single pitch): treat pitch range as 1 semitone; center the note bar vertically (draw at `y = canvas.height / 2 - h / 2`)

### Loading State

While the MIDI file is being fetched/parsed, the clip displays as today (green block with music note + name). The canvas appears once parsing completes. If fetching or parsing throws, the effect catches the error and returns without drawing — clip shows without preview.

### Effect Lifecycle

```ts
useEffect(() => {
  if (!downloadUrl || !canvasRef.current) return;
  let cancelled = false;
  (async () => {
    try {
      const res = await fetch(downloadUrl);
      const buf = await res.arrayBuffer();
      const { Midi } = await import("@tonejs/midi");
      const midi = new Midi(buf);
      if (cancelled) return;
      // ... render
    } catch {
      // silent: clip shows without preview
    }
  })();
  return () => { cancelled = true; };
}, [downloadUrl]);
```

Effect dependency: `[downloadUrl]`. When the signed URL rotates, the effect re-runs and re-renders the canvas.
