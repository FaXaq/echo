# MIDI Clip Piano Roll Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a read-only piano roll canvas overlay inside each MIDI clip block on the DAW timeline.

**Architecture:** Add `downloadUrl` prop to `MidiClipView`, fetch+parse the MIDI file with `@tonejs/midi`, and draw note bars to a `<canvas>` — identical pattern to the existing waveform in `AudioClipView`.

**Tech Stack:** React, `@tonejs/midi`, HTML5 Canvas API

---

## Chunk 1: Implementation

**Files:**
- Modify: `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-timeline.tsx`

### Task 1: Add `downloadUrl` prop and canvas to `MidiClipView`

- [ ] **Step 1: Add `downloadUrl?: string` to `MidiClipViewProps` (line ~827)**

```ts
interface MidiClipViewProps {
  clip: MidiClip;
  downloadUrl?: string;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: MidiClip) => void;
  onDelete: () => void;
}
```

- [ ] **Step 2: Add `canvasRef` and piano roll effect inside `MidiClipView`**

After `const clipWidth = ...`, add:

```ts
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  if (!downloadUrl || !canvasRef.current) return;
  let cancelled = false;
  (async () => {
    try {
      const res = await fetch(downloadUrl);
      const buf = await res.arrayBuffer();
      const { Midi } = await import("@tonejs/midi");
      const midi = new Midi(buf);
      if (cancelled || !canvasRef.current) return;

      const notes = midi.tracks.flatMap((t) => t.notes);
      const totalDuration = midi.duration;
      if (notes.length === 0 || totalDuration === 0) return;

      const minPitch = Math.min(...notes.map((n) => n.midi));
      const maxPitch = Math.max(...notes.map((n) => n.midi));
      const pitchRange = Math.max(1, maxPitch - minPitch);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(16,185,129,0.7)";

      const noteH = Math.max(1, canvas.height / (pitchRange + 1));
      for (const note of notes) {
        const x = (note.time / totalDuration) * canvas.width;
        const w = Math.max(1, (note.duration / totalDuration) * canvas.width);
        const normalizedPitch =
          minPitch === maxPitch
            ? 0.5
            : (note.midi - minPitch) / pitchRange;
        const y = canvas.height - normalizedPitch * canvas.height - noteH;
        ctx.fillRect(x, y, w, noteH);
      }
    } catch {
      // silent: clip shows without preview
    }
  })();
  return () => {
    cancelled = true;
  };
}, [downloadUrl]);
```

- [ ] **Step 3: Add `<canvas>` inside the clip `<div>` (before the `<span>`)**

```tsx
<canvas
  ref={canvasRef}
  className="absolute inset-0 w-full h-full"
  width={clipWidth}
  height={TRACK_HEIGHT - 8}
/>
```

- [ ] **Step 4: Pass `downloadUrl` at the call site (~line 607)**

```tsx
<MidiClipView
  key={clip.id}
  clip={clip}
  downloadUrl={downloadUrls.get(clip.file.storageKey)}
  secondsPerMeasure={secondsPerMeasure}
  onMouseDown={handleMidiMouseDown}
  onDelete={() => handleDeleteMidiClip(clip.id)}
/>
```

- [ ] **Step 5: Destructure `downloadUrl` in `MidiClipView` function signature**

```ts
function MidiClipView({ clip, downloadUrl, secondsPerMeasure, onMouseDown, onDelete }: MidiClipViewProps) {
```
