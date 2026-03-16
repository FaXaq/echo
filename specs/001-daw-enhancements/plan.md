# Implementation Plan: Web DAW Enhancements

**Branch**: `001-daw-enhancements` | **Date**: 2026-03-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-daw-enhancements/spec.md`

## Summary

Enhance the existing web DAW with five independently deliverable features: live clip repositioning during playback (replace raw AudioContext with Tone.js Transport), dB-scale volume control (schema migration + logarithmic slider), MIDI file import with General MIDI instrument presets (new `midi_clip` table + `soundfont-player`), individual audio clip export via context menu (fetch-blob-download, no new API), and full song export as WAV (Tone.js offline rendering + `audiobuffer-to-wav`).

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Tone.js v15, @tonejs/midi v2, webaudiofont v3, audiobuffer-to-wav, TanStack Router, tRPC, Fastify, Kysely, PostgreSQL
**Storage**: PostgreSQL — `track.volume` column type changes to FLOAT; new `midi_clip` table; new `track.instrument_preset` column
**Testing**: Vitest (unit tests for domain/app layers); React Testing Library for component tests
**Target Platform**: Modern browsers — Chrome 90+, Firefox 90+, Safari 15+ (Web Audio API required)
**Project Type**: Web application (monorepo: `apps/web` frontend + `apps/api` backend)
**Performance Goals**: Clip reposition reflects in <50 ms; clip export initiates download in <1 s; 3-min song export completes in <30 s
**Constraints**: All audio/MIDI synthesis is browser-only (no server-side synthesis); Tone.js instances stored in React refs, never state; `await Tone.start()` required inside user gesture

## Constitution Check

The project constitution file is a blank template (not ratified for this project). No constitution gates apply. The implementation follows the AGENTS.md architectural rules:

- ✅ Domain layer stays pure (no Tone.js in `packages/domain`)
- ✅ Ports defined in `packages/app`; adapters in `apps/api`
- ✅ Tone.js and browser audio libraries live exclusively in `apps/web`
- ✅ New tRPC procedures follow existing patterns (use-case factory → adapter → port)
- ✅ Schema changes via migration file in `packages/db/migrations/`
- ✅ No domain logic in tRPC resolvers

## Project Structure

### Documentation (this feature)

```text
specs/001-daw-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── trpc-changes.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (affected files)

```text
packages/db/
├── migrations/
│   └── 20260316000001_daw-enhancements.ts   # NEW: volume float, instrument_preset, midi_clip table
└── src/
    └── schema.d.ts                           # UPDATED: Track (volume float, instrumentPreset), MidiClip

packages/domain/src/
├── audio-clip/index.ts                       # UPDATED: FileType adds 'midi'
├── track/index.ts                            # UPDATED: volume type float, add instrumentPreset
└── midi-clip/                                # NEW: MidiClip, MidiClipId types
    └── index.ts

packages/app/src/
├── ports/
│   ├── track.ts                              # UPDATED: updateVolume takes dB, add setInstrumentPreset
│   └── midi-clip.ts                          # NEW: MidiClipRepoPort
└── use-cases/
    ├── track/
    │   ├── update-track-volume.ts            # UPDATED: validates dB range
    │   └── set-track-instrument-preset.ts    # NEW
    └── midi-clip/
        ├── index.ts                          # NEW: barrel export
        ├── register-midi-clip.ts             # NEW
        ├── list-midi-clips-by-song.ts        # NEW
        ├── update-midi-clip-position.ts      # NEW
        ├── rename-midi-clip.ts               # NEW
        └── delete-midi-clip.ts              # NEW

apps/api/src/
├── adapters/
│   ├── track.ts                              # UPDATED: updateVolume, setInstrumentPreset
│   └── midi-clip.ts                          # NEW: MidiClipAdapter implementing MidiClipRepoPort
├── router/organizations/
│   ├── track.ts                              # UPDATED: updateVolume input renamed, add setInstrumentPreset
│   └── midi-clip.ts                          # NEW: midiClip sub-router
└── server.ts / router/index.ts               # UPDATED: add midiClip to organization router + context

apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/
├── -daw.tsx                                  # UPDATED: Tone.js Transport, dB volume, MIDI clips, export
├── -timeline.tsx                             # UPDATED: dB slider display, clip export, MIDI clip rows
└── -track-list.stories.tsx                   # UPDATED: stories for new controls
```

**Structure Decision**: Web application (Option 2 from template). Backend changes span `packages/domain`, `packages/app`, and `apps/api`. All browser audio code (Tone.js, soundfont-player) lives exclusively in `apps/web`.

## Implementation Phases (overview — tasks detail in tasks.md)

### Phase A: Database & Domain (prerequisite for everything)
1. Write migration: `volume` → FLOAT, add `instrument_preset`, create `midi_clip` table
2. Run migration + regenerate `schema.d.ts`
3. Update domain types: `Track` (volume dB, instrumentPreset), `MidiClip` (new), `FileType` (add 'midi')

### Phase B: dB Volume (P2 — highest backend impact, standalone)
4. Update `TrackRepoPort.updateVolume` signature to accept dB float
5. Update `update-track-volume` use case with dB validation (−60 to +6)
6. Update `track.ts` adapter in `apps/api`
7. Update `track.ts` router: rename input field, update zod schema
8. Update frontend `-timeline.tsx`: dB Slider (min −60, max 6, step 0.1, show "0.0 dB" label)
9. Update frontend `-daw.tsx`: `gainNode.gain.value = Tone.dbToGain(track.volume)`

### Phase C: Tone.js Transport (P1 — audio engine refactor)
10. Install `tone` in `apps/web`
11. Replace `handlePlay` / `handleStop` in `-daw.tsx`:
    - `await Tone.start()` on play button click
    - Create `Tone.Player` per clip, `new Tone.Volume(track.volume)` per track
    - `player.sync().start(measureToToneTime(clip.startMeasure, bpm))`
    - `Tone.getTransport().bpm.value = bpm; transport.start()`
    - Store players in `playersRef: Map<clipId, Tone.Player>`
    - Store volumes in `volumesRef: Map<trackId, Tone.Volume>`
12. Implement live clip repositioning:
    - On clip drag: if playing, `player.stop(); player.unsync(); rescheduleIfFuture()`
    - Stop: `transport.stop(); players.forEach(p => p.dispose())`
13. Wire `volumesRef` to `onVolumeChanged` so real-time dB changes apply: `vol.volume.value = newDb`

### Phase D: MIDI Infrastructure (P3 — backend)
14. Create `packages/domain/src/midi-clip/index.ts`
15. Create `packages/app/src/ports/midi-clip.ts` (`MidiClipRepoPort`)
16. Create 5 use cases under `packages/app/src/use-cases/midi-clip/`
17. Create `apps/api/src/adapters/midi-clip.ts` (Kysely queries for all port methods)
18. Create `apps/api/src/router/organizations/midi-clip.ts` (6 procedures)
19. Wire `midiClip` adapter into context and sub-router into organization router

### Phase E: MIDI Frontend (P3 — playback)
20. Install `@tonejs/midi`, `webaudiofont` in `apps/web`
21. Add MIDI clip upload flow to `-timeline.tsx` (separate file input, `contentType: 'audio/midi'`)
22. Render `MidiClip` blocks on timeline (distinct color/label)
23. In `-daw.tsx` `handlePlay`: fetch MIDI file URLs, parse with `@tonejs/midi`, load instruments via `soundfont-player`, schedule notes on Tone.Transport
24. Add instrument preset selector to track left panel

### Phase F: Individual Clip Export (P4 — frontend only)
25. Add "Export clip" to `AudioClipView` context menu in `-timeline.tsx`
26. Handler: `fetch(downloadUrl)` → Blob → `URL.createObjectURL` → `<a download>` → revoke
27. Derive filename from `clip.name ?? stripExtension(clip.file.filename)` + extension from original filename

### Phase G: Song Export (P5 — frontend only)
28. Install `audiobuffer-to-wav` in `apps/web`
29. Add "Export song" button to `-daw.tsx` header
30. Implement `handleExport`:
    - Calculate total duration in seconds
    - `Tone.Offline(async () => { /* schedule all clips + MIDI */ }, duration)`
    - `toWav(buffer.get())` → Blob → download
31. Disable export button during active export; show progress indicator

## Complexity Tracking

No constitution violations. No complexity justification required.
