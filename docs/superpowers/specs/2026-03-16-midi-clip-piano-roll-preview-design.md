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

## Design

### Data Flow

1. On mount, call the existing `getSignedUrl` tRPC query for the clip's `fileId` (same signed URL mechanism used by audio clips)
2. Fetch the MIDI file, pass the `ArrayBuffer` to `new Midi(arrayBuffer)` from `@tonejs/midi` (already in the project)
3. Flatten all MIDI tracks' notes into a single `{ time, duration, midi }[]` list
4. Derive rendering bounds:
   - `minPitch` / `maxPitch` — for Y auto-scaling (notes fill the full canvas height)
   - `totalDuration` — from `midi.duration` (seconds), used for X scaling against canvas width
5. Draw each note as a `fillRect` on a `<canvas>` that fills the clip block

### Rendering

- **Canvas**: absolutely positioned, fills clip block width and height (same as waveform canvas)
- **Note bar**: `rgba(16, 185, 129, 0.7)` — emerald, matching the clip's existing green theme
- **Y axis**: pitch mapped top-to-bottom (high MIDI value = top); auto-scaled to `[minPitch, maxPitch]`
- **X axis**: note time and duration mapped to canvas width proportionally using `totalDuration`
- **Minimums**: 1px height per note bar, 1px width per note bar
- **Background**: transparent — clip's existing `bg-emerald-500/20` shows through

### Loading State

While the MIDI file is being fetched/parsed, the clip displays as it does today (green block with music note + name). The canvas appears once parsing completes. No explicit error state is needed — if parsing fails the clip simply shows without the preview.

## Scope of Changes

Single file: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-timeline.tsx`

Changes:
- Add canvas ref, signed URL query, and fetch/parse/render effect to `MidiClipView`
- Add `<canvas>` element inside the clip block (styled identically to the waveform canvas in `AudioClipView`)

## Implementation Reference

Mirror the existing pattern in `AudioClipView` (lines ~697–754 of `-timeline.tsx`):

```ts
// Fetch → decode → render
const url = await getSignedUrl(clip.fileId);
const res = await fetch(url);
const buf = await res.arrayBuffer();
const { Midi } = await import("@tonejs/midi");
const midi = new Midi(buf);

const notes = midi.tracks.flatMap(t => t.notes);
if (notes.length === 0) return;

const minPitch = Math.min(...notes.map(n => n.midi));
const maxPitch = Math.max(...notes.map(n => n.midi));
const totalDuration = midi.duration; // seconds

const canvas = canvasRef.current;
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(16,185,129,0.7)";

for (const note of notes) {
  const x = (note.time / totalDuration) * canvas.width;
  const w = Math.max(1, (note.durationTicks / midi.header.ppq / ...) * ...);
  const y = canvas.height - ((note.midi - minPitch) / Math.max(1, maxPitch - minPitch)) * canvas.height;
  const h = Math.max(1, canvas.height / Math.max(1, maxPitch - minPitch + 1));
  ctx.fillRect(x, y - h, Math.max(1, w), h);
}
```

(Exact arithmetic will be derived from canvas dimensions during implementation.)
