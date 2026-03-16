# Tasks: Web DAW Enhancements

**Input**: Design documents from `/specs/001-daw-enhancements/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/trpc-changes.md ✓

**Organization**: Tasks grouped by user story to enable independent implementation and testing.
**Tests**: Not explicitly requested — no test tasks generated.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and prepare the frontend for all audio work.

- [X] T001 Install `tone` and `audiobuffer-to-wav` in `apps/web` (`pnpm --filter @echo/web add tone audiobuffer-to-wav`)
- [X] T002 [P] Install `@tonejs/midi` and `webaudiofont` in `apps/web` (`pnpm --filter @echo/web add @tonejs/midi webaudiofont`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and domain/backend changes that ALL user stories depend on.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [X] T003 Write migration file `packages/db/migrations/20260316000001_daw-enhancements.ts` — add `track.instrument_preset INTEGER NULL`, convert `track.volume` from INTEGER to FLOAT with dB migration formula (`CASE WHEN volume = 0 THEN -60.0 ELSE 20.0 * LOG(volume::float / 100.0) / LOG(10.0) END`), create `midi_clip` table (id, track_id FK, file_id FK, name, start_measure FLOAT DEFAULT 1, duration_ms INT NULL, created_at)
- [X] T004 Apply the migration (`pnpm --filter @echo/db migrate`) and regenerate the Kysely schema (`pnpm --filter @echo/db generate`) — verify `packages/db/src/schema.d.ts` reflects `Track.volume: number` (float), `Track.instrumentPreset: number | null`, and new `MidiClip` interface
- [X] T005 [P] Update `FileType` in `packages/domain/src/audio-clip/index.ts` — change `z.enum(["audio"])` to `z.enum(["audio", "midi"])`
- [X] T006 [P] Update `Track` domain type in `packages/domain/src/track/index.ts` — change `volume: number` field JSDoc/comment to reflect dB scale (−60 to +6, default 0), add `instrumentPreset: number | null` field
- [X] T007 Create new domain type file `packages/domain/src/midi-clip/index.ts` — export `MidiClipId = string`, `MidiClip` type (id, trackId, fileId, file: AudioFile, name: string|null, startMeasure: number, durationMs: number|null, createdAt: Date), and an `index.ts` barrel in `packages/domain/src/midi-clip/`
- [X] T008 Update `TrackRepoPort` in `packages/app/src/ports/track.ts` — rename `updateVolume(trackId, volume)` parameter to `volumeDb: number` with range note (−60 to +6); add new method `setInstrumentPreset(trackId: string, preset: number | null): Promise<Track>`
- [X] T009 Update `update-track-volume` use case in `packages/app/src/use-cases/track/update-track-volume.ts` — change input validation from 0–100 to `z.number().min(-60).max(6)` and update the call to `trackRepo.updateVolume`
- [X] T010 Create `set-track-instrument-preset` use case in `packages/app/src/use-cases/track/set-track-instrument-preset.ts` — validate preset as `z.number().int().min(0).max(127).nullable()`, call `trackRepo.setInstrumentPreset`, export from `packages/app/src/use-cases/track/index.ts`
- [X] T011 Update track adapter in `apps/api/src/adapters/track.ts` — update `updateVolume` DB query (column is now FLOAT, no conversion needed), add `setInstrumentPreset` method (UPDATE track SET instrument_preset = $1 WHERE id = $2)
- [X] T012 Update `organization/track.ts` router in `apps/api/src/router/organizations/track.ts` — rename input field `volume` → `volumeDb` with `z.number().min(-60).max(6)` validation; add `setInstrumentPreset` procedure that calls `makeSetTrackInstrumentPreset({ trackRepo: ctx.organization.track })(input)` wrapped in try/catch with `appErrorToTRPC`
- [X] T013 Create `MidiClipRepoPort` in `packages/app/src/ports/midi-clip.ts` — interface with methods: `listBySong(songId)`, `create(input: CreateMidiClipInput)`, `updatePosition(clipId, startMeasure)`, `rename(clipId, name)`, `delete(clipId)`, `getDownloadUrls(storageKeys)`; export `CreateMidiClipInput` type
- [X] T014 [P] Create `register-midi-clip` use case in `packages/app/src/use-cases/midi-clip/register-midi-clip.ts` — accepts `{trackId, filename, storageKey, organizationId, startMeasure, durationMs}`, creates a `File` record (type='midi') + `MidiClip` record via `midiClipRepo.create`
- [X] T015 [P] Create `list-midi-clips-by-song` use case in `packages/app/src/use-cases/midi-clip/list-midi-clips-by-song.ts` — calls `midiClipRepo.listBySong(songId)`
- [X] T016 [P] Create `update-midi-clip-position` use case in `packages/app/src/use-cases/midi-clip/update-midi-clip-position.ts` — validates `startMeasure >= 1`, calls `midiClipRepo.updatePosition`
- [X] T017 [P] Create `rename-midi-clip` use case in `packages/app/src/use-cases/midi-clip/rename-midi-clip.ts` — validates name is non-empty, calls `midiClipRepo.rename`
- [X] T018 [P] Create `delete-midi-clip` use case in `packages/app/src/use-cases/midi-clip/delete-midi-clip.ts` — calls `midiClipRepo.delete`; create barrel `packages/app/src/use-cases/midi-clip/index.ts` exporting all five use cases
- [X] T019 Create MIDI clip adapter `apps/api/src/adapters/midi-clip.ts` — implement `MidiClipRepoPort` using Kysely: `listBySong` joins `midi_clip` → `file`, `create` inserts into `file` then `midi_clip` (in a transaction), `updatePosition`/`rename`/`delete` are simple UPDATE/DELETE queries, `getDownloadUrls` generates presigned S3 URLs (mirror the audio clip adapter pattern)
- [X] T020 Create `organization/midi-clip.ts` router in `apps/api/src/router/organizations/midi-clip.ts` — six procedures: `register`, `listBySong`, `updatePosition`, `rename`, `delete`, `getDownloadUrls`; each calls the corresponding use-case factory with `midiClip: ctx.organization.midiClip`; wrap all in try/catch → `appErrorToTRPC`
- [X] T021 Wire MIDI clip into the server — add `midiClip` adapter to the tRPC context in `apps/api/src/context.ts` (or `server.ts`), add `midiClip: makeMidiClipRouter()` inside the `organization` sub-router in `apps/api/src/router/organizations/index.ts`

**Checkpoint**: Foundation ready. Run `pnpm dev` — all existing DAW functionality should still work (track volumes migrated to dB, new `midiClip` procedures available on the router).

---

## Phase 3: User Story 1 — Clip Repositioning During Playback (Priority: P1) 🎯 MVP

**Goal**: Audio clips can be dragged to new positions while the song plays, without stopping playback.

**Independent Test**: Start playback with at least one audio clip. Drag the clip to a new measure. The clip's audio cuts off at the old position and resumes from the new position without the Transport stopping.

- [X] T022 [US1] Replace `handlePlay` in `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-daw.tsx` — remove direct `AudioContext` / `AudioBufferSourceNode` code; add `import * as Tone from 'tone'`; add refs: `transportRef`, `playersRef: Map<clipId, {player: Tone.Player, eventId: number}>`, `volumesRef: Map<trackId, Tone.Volume>`; in `handlePlay`: call `await Tone.start()`, set `Tone.getTransport().bpm.value = bpm`, create one `Tone.Volume(track.volume)` per track (stored in `volumesRef`), create one `Tone.Player` per clip loaded from its download URL, connect player → volume → `Tone.getDestination()`, schedule each clip with `const eventId = Tone.getTransport().schedule(t => player.start(t), startSeconds)` (store eventId in `playersRef`), then `Tone.getTransport().start()`
- [X] T023 [US1] Replace `handleStop` in `-daw.tsx` — call `Tone.getTransport().stop()`, iterate `playersRef` to call `player.dispose()` and clear, iterate `volumesRef` to call `vol.dispose()` and clear, reset `playbackPosition` to 0
- [X] T024 [US1] Implement live clip repositioning in `-daw.tsx` — update `handleClipPositionChanged` callback: if `isPlaying` and clip exists in `playersRef`, call `Tone.getTransport().clear(eventId)`, call `player.stop()`, compute `newStartSeconds = (newMeasure - 1) * secondsPerMeasure`; if `newStartSeconds > Tone.getTransport().seconds`, reschedule with a new `Tone.getTransport().schedule(...)` and update the stored `eventId`; otherwise leave unscheduled (clip is in the past)
- [X] T025 [US1] Replace the `requestAnimationFrame` playback position ticker in `-daw.tsx` — use `Tone.getTransport().scheduleRepeat(time => setPlaybackPosition(Tone.getTransport().seconds / secondsPerMeasure), "16n")` (or a `requestAnimationFrame` loop reading `Tone.getTransport().seconds`) so `playbackPosition` stays in sync with Tone's Transport clock; cancel the repeat in `handleStop`
- [X] T026 [US1] Wire real-time volume changes — update `handleVolumeChanged` in `-daw.tsx`: in addition to the existing debounced tRPC mutation, immediately call `volumesRef.current.get(trackId)?.volume.value = newVolumeDb` when `isPlaying` so volume changes take effect mid-playback without restarting

**Checkpoint**: Play a song, drag a clip — playback continues without interruption. Volume slider changes are audible immediately during playback.

---

## Phase 4: User Story 2 — dB Volume Control (Priority: P2)

**Goal**: Track volume slider displays dB values and uses a logarithmic scale that matches perceived loudness.

**Independent Test**: The volume slider on any track shows "0.0 dB" at its default position. Dragging it down shows negative dB values. Setting it to the minimum results in silence. Setting it to 0 dB sounds the same as before migration (unity gain).

- [X] T027 [US2] Update the volume `Slider` in `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/-timeline.tsx` — change `min={0} max={100}` to `min={-60} max={6} step={0.1}`; change `value={[track.volume]}` and `onValueChange={([v]) => onVolumeChanged(track.id, v)}` (no conversion needed — value is already dB); add a label below the slider showing the current dB value formatted as `"0.0 dB"` / `"-6.0 dB"` (use `track.volume.toFixed(1) + " dB"`)

**Checkpoint**: Load the DAW. Every track shows a dB readout. Setting a track to −60 dB and playing produces silence. Two tracks at different dB values sound proportionally different.

---

## Phase 5: User Story 3 — MIDI File Import & Preset Playback (Priority: P3)

**Goal**: `.mid` files can be uploaded to a track, appear on the timeline, and play back using a selectable GM instrument preset.

**Independent Test**: Upload a `.mid` file to a track. A MIDI clip appears (visually distinct from audio clips). Press play — the MIDI notes play using the default piano preset. Change the preset to "Violin" — on next play the notes use violin sound.

### Backend is complete (T013–T021 in Phase 2). Frontend tasks follow.

- [X] T028 [US3] Add `midiClips` state and tRPC queries in `-daw.tsx` — add `const [midiClips, setMidiClips] = useState<MidiClip[]>(initialMidiClips)` (load via loader); add `trpc.organization.midiClip.getDownloadUrls.useQuery` for MIDI files; add handlers `handleMidiClipUploaded`, `handleMidiClipPositionChanged`, `handleMidiClipDeleted`; pass `midiClips` and handlers down to `<Timeline>`; add `initialMidiClips` to the route loader in `apps/web/src/routes/_auth-guard/organizations/$organizationSlug/songs/$songSlug/route.tsx`
- [X] T029 [US3] Add MIDI upload flow to `-timeline.tsx` — add a second hidden `<input type="file" accept=".mid,audio/midi">` per track (stored in `midiFileInputRefs`); in the track context menu add an "Upload MIDI" item alongside "Upload audio"; implement `handleUploadMidi(trackId, file, startMeasure)` using the existing `getUploadUrl.mutateAsync` flow (pass `contentType: 'audio/midi'`) followed by a `registerMidiClip.mutate(...)` call; call `onMidiClipUploaded(clip)` on success
- [X] T030 [US3] Render MIDI clip blocks on the timeline in `-timeline.tsx` — add a `MidiClipView` component (similar to `AudioClipView` but without a waveform canvas): render as a block with a distinct colour (e.g. `bg-emerald-500/20 border-emerald-500/40`), show the clip name, support drag-to-reposition (reuse the same `handleMouseDown` logic, wire to `onMidiClipPositionChanged`) and a context menu with "Delete clip" (no "Export clip" — MIDI export is out of scope); render `MidiClipView` blocks in each track lane alongside `AudioClipView` blocks
- [X] T031 [US3] Add instrument preset selector to the track left panel in `-timeline.tsx` — below the volume slider add a `<select>` (or shadcn `Select`) populated with the 128 GM instrument names (import a GM name constant array); bind to `track.instrumentPreset ?? 0`; on change call a new `onInstrumentPresetChanged(trackId, preset)` prop which dispatches `trpc.organization.track.setInstrumentPreset.useMutation()`; only show the selector when the track has at least one MIDI clip
- [X] T032 [US3] Add MIDI playback to `-daw.tsx` `handlePlay` — after setting up audio clip players (T022): import `{ Midi }` from `@tonejs/midi` and `WebAudioFontPlayer` from `webaudiofont`; for each MIDI clip, fetch its download URL, decode as `ArrayBuffer`, parse with `new Midi(arrayBuffer)`; for the track's `instrumentPreset` (default 0), load the corresponding WebAudioFont instrument (lazy-load and cache in `instrumentCacheRef: Map<number, any>`); schedule all notes using `Tone.getTransport().schedule(time => wafPlayer.queueWaveTable(audioCtx, gainNode, fontVar, time, note.midi, note.duration, velocity), note.time + clipOffsetSeconds)`

**Checkpoint**: Upload a `.mid` file, press play, hear the notes with a piano sound. Change preset to a different instrument, press play again — different sound. MIDI clips appear on the timeline in a different colour from audio clips.

---

## Phase 6: User Story 4 — Individual Clip Export via Context Menu (Priority: P4)

**Goal**: Right-clicking an audio clip offers "Export clip" — clicking it immediately downloads that clip's audio file.

**Independent Test**: Right-click any audio clip. Context menu appears with "Export clip". Click it. A file download starts. The downloaded file plays back as just that clip's audio, nothing else.

- [X] T033 [US4] Add "Export clip" to `AudioClipView` context menu in `-timeline.tsx` — in the `<ContextMenuContent>` of `AudioClipView`, add a `<ContextMenuItem>` labelled "Export clip" before the delete item; its `onSelect` handler: if `downloadUrl` is not yet available show a toast/do nothing; otherwise `fetch(downloadUrl)` → `.blob()` → `URL.createObjectURL(blob)` → create an `<a>` element with `href=blobUrl` and `download="${clipName}.${ext}"` (derive `ext` from `clip.file.filename.split('.').pop()`, derive `clipName` from `clip.name ?? stripExtension(clip.file.filename)`) → `document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl)`

**Checkpoint**: Right-click a clip → "Export clip" appears → clicking it downloads the file → the file plays correctly in an external player.

---

## Phase 7: User Story 5 — Song Export (Priority: P5)

**Goal**: A single "Export song" action renders all tracks as a mixed-down WAV file and triggers a browser download.

**Independent Test**: With a song containing two or more audio tracks at different volume levels, click "Export song". A download starts within 30 seconds. The WAV file, when opened in an external player, contains all clips at the correct positions and relative volumes.

- [X] T034 [US5] Add "Export song" button to the DAW header in `-daw.tsx` — add a `<Button>` labelled "Export song" (variant outline) next to the Play/Stop button; add `isExporting` state; disable the button while `isExporting` is true; show "Exporting…" label while in progress
- [X] T035 [US5] Implement `handleExport` in `-daw.tsx` — set `isExporting = true`; calculate total duration in seconds from the last clip end (same logic as `totalMeasures` in `-timeline.tsx`); call `const buffer = await Tone.Offline(async () => { /* rebuild the same audio graph as handlePlay but inside the offline context: create Tone.Player per audio clip, Tone.Volume per track, schedule all clips and MIDI notes */ Tone.getTransport().start(); }, totalDurationSeconds)`; convert result: `import toWav from 'audiobuffer-to-wav'; const wav = toWav(buffer.get()!)`; create `Blob([wav], {type:'audio/wav'})` → `URL.createObjectURL` → `<a download="${song.name}.wav">` → click → revoke; set `isExporting = false`

**Checkpoint**: Export a 3-track song. The WAV download arrives within 30 seconds. Playing it in an external player reproduces the correct mix.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: i18n, Storybook, and robustness improvements across all stories.

- [X] T036 [P] Add i18n keys for all new user-visible strings in `packages/i18n/locales/en.json` and `fr.json` (songs namespace): "Export clip", "Export song", "Exporting…", "Upload MIDI", "Instrument", dB label format, error messages for failed exports
- [X] T037 [P] Wrap all new user-visible strings in `-timeline.tsx` and `-daw.tsx` with `<Trans t={t}>` / `t()` using the `"songs"` namespace
- [X] T038 [P] Update `-daw.stories.tsx` — add story variant showing a song with MIDI clips and the export button; update `isPlaying` story to use the new Tone.js state shape
- [X] T039 [P] Update `-timeline.stories.tsx` — add story showing dB slider label, MIDI clip blocks, instrument preset selector, and "Export clip" context menu item
- [X] T040 Add error handling for failed exports in `-daw.tsx` — wrap `handleExport` in try/catch; on error set `isExporting = false` and surface a user-visible error message (toast or inline error); handle missing download URLs gracefully (skip clip with console.warn rather than throwing)
- [X] T041 Add loading state for MIDI instrument loading in `-daw.tsx` — while WebAudioFont instruments are loading during `handlePlay`, show a brief "Loading instruments…" indicator; if instrument loading fails for a track, skip that track's MIDI notes (don't abort playback)
- [X] T042 Run `quickstart.md` validation — apply the migration, verify dB values in the DB, play back a song, drag a clip during playback, export a clip, export the song; confirm all success criteria from the spec are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational (needs dB volume in DB + schema)
- **US2 (Phase 4)**: Depends on Foundational (backend already done in Phase 2; only frontend display work remains)
- **US3 (Phase 5)**: Depends on Foundational + US1 (MIDI playback needs the Tone.js Transport from US1)
- **US4 (Phase 6)**: Depends on Foundational only — fully independent of US1/US2/US3
- **US5 (Phase 7)**: Depends on US1 (needs Tone.js) and US3 (to include MIDI in the export)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
         ├── Phase 3 (US1 Tone.js) ──────────────────────────────────────── Phase 7 (US5 Export)
         ├── Phase 4 (US2 dB display) — independent                              ▲
         ├── Phase 5 (US3 MIDI) — depends on Phase 3 ─────────────────────────────┘
         └── Phase 6 (US4 Clip Export) — independent
```

### Parallel Opportunities

Within Phase 2 (Foundational):
- T005, T006, T007 can run in parallel (different domain files)
- T014, T015, T016, T017, T018 can run in parallel (different use case files)
- T003–T004 must complete before T005–T021

Within Phase 5 (US3 MIDI):
- T028 (DAW state) and T029 (upload flow) and T030 (timeline render) can start in parallel
- T031 (preset selector) can run alongside T030
- T032 (MIDI playback) depends on T028

---

## Parallel Example: Phase 2 Foundation

```
# Batch 1 — run these together:
Task T003: Write migration file
Task T007: Create MidiClip domain type

# Batch 2 — after T003/T004 complete:
Task T005: Update FileType ('midi')
Task T006: Update Track domain type (dB, instrumentPreset)

# Batch 3 — after T013 (MidiClipRepoPort) completes:
Task T014: register-midi-clip use case
Task T015: list-midi-clips-by-song use case
Task T016: update-midi-clip-position use case
Task T017: rename-midi-clip use case
Task T018: delete-midi-clip use case
```

---

## Implementation Strategy

### MVP First (User Story 1 — Clip Repositioning)

1. Complete Phase 1: Setup (install Tone.js)
2. Complete Phase 2: Foundational (migration + domain + track dB backend)
3. Complete Phase 3: US1 (Tone.js Transport + live repositioning)
4. **STOP and VALIDATE**: drag clips during playback — no interruptions
5. Demo/deploy if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Live clip repositioning ✓
3. Phase 4 (US2) → dB volume display ✓
4. Phase 6 (US4) → Individual clip export ✓ (independent, easy win)
5. Phase 5 (US3) → MIDI import and playback ✓
6. Phase 7 (US5) → Full song export ✓

### Suggested Parallel Split (two developers)

After Phase 2 completes:
- **Dev A**: Phase 3 (US1 Tone.js) → Phase 4 (US2 dB display) → Phase 7 (US5 export)
- **Dev B**: Phase 5 (US3 MIDI backend + frontend) → Phase 6 (US4 clip export)

---

## Notes

- All Tone.js instances (`Tone.Player`, `Tone.Volume`, Transport event IDs) must live in React **refs**, never state
- `await Tone.start()` must be called inside a user gesture handler (the play button click)
- The dB migration is one-directional — existing 0–100 values are converted to dB on migration; no rollback to 0–100
- Individual clip export (T033) requires no new API; the download URL is already available in `downloadUrls` map
- MIDI export is intentionally out of scope for this feature
- WebAudioFont instruments are loaded lazily; cache in a ref Map keyed by GM program number to avoid repeated network requests
