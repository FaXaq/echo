# Research: Web DAW Enhancements

**Date**: 2026-03-16
**Feature**: 001-daw-enhancements

---

## Decision 1: Audio Engine — Tone.js Transport replaces raw AudioContext

**Decision**: Replace the current `AudioContext + AudioBufferSourceNode` scheduling approach with **Tone.js** (`tone` npm package, v15) for all playback.

**Rationale**: `AudioBufferSourceNode` can only be started once; it cannot be repositioned mid-playback without stopping the whole context. Tone.js wraps the Web Audio API with a DAW-style `Transport` that separates the playback clock from individual clip scheduling. This allows clips to be stopped, rescheduled, and restarted independently without touching the global clock.

**Key APIs**:
- `Tone.getTransport()` — global clock. `.start()`, `.stop()`, `.seconds` (current position), `.bpm.value`
- `Tone.Player` — loads an `AudioBuffer`, `.sync().start("Nm")` to schedule at measure N, `.stop()` + `.unsync()` to cancel
- `Tone.Volume` — dB-based gain node: `vol.volume.value = -6` takes effect immediately during playback
- `Tone.Offline(callback, duration)` — offline rendering for export, returns a `ToneAudioBuffer`
- `await Tone.start()` — required inside a user gesture to resume the AudioContext
- All Tone instances stored in React **refs**, never state

**Clip repositioning pattern during playback**:
1. Store the event ID returned by `Transport.schedule(callback, startTime)` when scheduling each clip
2. `Transport.clear(eventId)` — cancels the scheduled event without touching the Transport clock
3. If the clip is mid-play: also call `player.stop()` to cut its current audio
4. If `newStartSeconds > transport.seconds`: call `Transport.schedule(callback, newStartSeconds)` to reschedule
5. Else: no reschedule (new position is in the past for this playback pass)
6. Transport clock never stopped

**Alternatives considered**:
- Raw `AudioContext` with epoch-based transport (custom implementation) — possible but significant complexity; Tone.js solves this correctly and is battle-tested
- Howler.js — no Transport concept; suitable for simple playback, not DAW scheduling

---

## Decision 2: Volume — store in dB as PostgreSQL FLOAT

**Decision**: Change `track.volume` column from `INTEGER DEFAULT 100` (0–100 scale) to `FLOAT DEFAULT 0.0` (dB scale, range −60.0 to +6.0).

**Rationale**: The spec requires volume displayed and stored in dB. Storing dB directly avoids double-conversion (DB → linear → dB). The existing column is renamed in meaning but the column itself can be repurposed with a migration.

**Key formulas**:
- dB → linear gain for Web Audio: `Math.pow(10, db / 20)`
- Linear → dB: `20 * Math.log10(linearGain)`
- Tone.js provides: `Tone.dbToGain(db)` and `Tone.gainToDb(linear)`

**dB scale**:
- Minimum: **−60.0 dB** (practical silence; −96 dB is 16-bit noise floor but −60 is sufficient)
- Maximum: **+6.0 dB** (slight amplification headroom)
- Unity gain (default): **0.0 dB**

**Migration strategy for existing data**:
- Old scale 0–100 was used as `volume / 100 = linearGain`
- Conversion: `new_db = CASE WHEN old_volume = 0 THEN -60 ELSE 20 * LOG(old_volume::float / 100) / LOG(10) END`
- PostgreSQL `LOG(x)` is base-10 (Postgres-specific), so `20 * LOG(volume / 100.0)` works directly

**Storage**: FLOAT (real), no integer encoding. PostgreSQL `FLOAT` (double precision) or `REAL` (single precision) both sufficient.

---

## Decision 3: MIDI Storage — separate `midi_clip` table

**Decision**: Add a new `midi_clip` table rather than extending `audio_clip` with a type discriminant.

**Rationale**: MIDI clips and audio clips have different playback mechanics, different domain representations, and different attributes (instrument preset lives on the track, not the clip). Keeping them separate follows the existing domain model where `AudioClip` is its own type.

**Schema**:
```
midi_clip:
  id            TEXT PRIMARY KEY
  track_id      TEXT NOT NULL → track.id
  file_id       TEXT NOT NULL → file.id (type='midi')
  name          TEXT NULL
  start_measure REAL DEFAULT 1
  duration_ms   INTEGER NULL   -- derived from MIDI file header at upload time
  created_at    TIMESTAMPTZ DEFAULT NOW()
```

**Track schema addition**:
```
track.instrument_preset  INTEGER NULL   -- GM program 0–127, NULL = default (Acoustic Piano = 0)
```

The `file` table already has a `type` field; MIDI files will use `type = 'midi'`.

---

## Decision 4: MIDI Playback — `@tonejs/midi` + `WebAudioFont`

**Decision**: Use `@tonejs/midi` for MIDI file parsing and **WebAudioFont** (`webaudiofont` npm package, v3.0.4) for instrument synthesis.

**Rationale**: `soundfont-player` was initially considered but is unmaintained since ~2020. WebAudioFont is actively maintained (v3.0.4), includes 2000+ instruments covering the full GM set, uses wavetable synthesis (lower latency than sample-playback), works directly with the Web Audio API, and ships a simpler scheduling API.

**`@tonejs/midi` key API**:
```
new Midi(arrayBuffer)            // parse .mid file
midi.tracks[n].notes             // [{name, time, duration, velocity}]
midi.tracks[n].instrument.number // GM program number (0-127)
midi.header.ppq                  // pulses per quarter note
// beats from ticks: beats = note.ticks / midi.header.ppq
```

**`WebAudioFont` key API**:
```
const player = new WebAudioFontPlayer();
player.loader.startLoad(audioContext, url, variable); // load instrument font
player.loader.waitLoad(() => {                         // callback when ready
  player.queueWaveTable(audioContext, audioContext.destination,
    window[variable], when, pitch, duration, volume);
});
```
- Instruments identified by GM program number; font variable follows naming convention
- `pitch`: MIDI note number (0–127)
- `when`: `audioContext.currentTime + offsetSeconds`
- `duration`: note duration in seconds

**Loading strategy**: Instruments loaded lazily per track on first playback or preset change. Cache loaded player instances in a ref Map keyed by GM program number to avoid reloading.

**Alternatives considered**:
- `soundfont-player` — unmaintained since 2020; rejected
- Tone.js `PolySynth` — no GM presets, sounds electronic; insufficient
- Tone.js `Sampler` with custom samples — too much bundle complexity
- SpessaSynth — high fidelity but not on npm; heavier integration; overkill for v1
- `@magenta/music` — ML generation library; only synthesis part would be used

---

## Decision 5: Individual Clip Export — fetch-blob-download pattern

**Decision**: Implement clip export as a pure client-side operation: fetch the clip's signed S3 URL as a blob, create a blob URL, and trigger a browser `<a download>`.

**Rationale**: The `download` attribute on `<a>` does not work for cross-origin URLs (signed S3 URLs). A `fetch()` + `Blob` approach works as long as the S3 bucket CORS policy allows `GET` from the web app origin. Since audio files are already fetched for playback, CORS is already configured.

**No new tRPC procedure needed** — the existing `getDownloadUrls` query already provides the signed URL. The "Export clip" context menu item just triggers the fetch-blob-download flow with the URL it already has.

**Filename**: `${clip.name ?? stripExtension(clip.file.filename)}.${extension}` where extension is derived from `clip.file.filename`.

---

## Decision 6: Song Export — `Tone.Offline` + `audiobuffer-to-wav`

**Decision**: Use `Tone.Offline()` for non-realtime rendering (consistent with the Tone.js engine already used for playback) and `audiobuffer-to-wav` for WAV encoding.

**Rationale**: Since we're adopting Tone.js for playback, `Tone.Offline()` creates an isolated offline context using the same Tone.js scheduling primitives. This ensures the export is consistent with what the user hears during playback. `audiobuffer-to-wav` is a minimal library that converts the resulting `AudioBuffer` to WAV bytes.

**Export flow**:
1. Calculate total song duration in seconds
2. `Tone.Offline(async () => { /* schedule all clips */ }, durationSeconds)`
3. Inside the callback: fetch all audio files (parallel), decode with `offlineCtx.decodeAudioData`, schedule Players with correct measure offsets and Volume nodes
4. For MIDI tracks: schedule soundfont notes using `Tone.Transport.schedule()` within the offline context
5. `const wavArrayBuffer = toWav(toneAudioBuffer.get())`
6. Create blob → `URL.createObjectURL` → `<a download>` → revoke

**Output**: Stereo WAV at 44.1 kHz (Web Audio default).

---

## Libraries to Install

| Package | Purpose | Location |
|---------|---------|----------|
| `tone` | Transport, Players, Volume, Offline render | `apps/web` |
| `@tonejs/midi` | Parse .mid files | `apps/web` |
| `webaudiofont` | GM instrument synthesis (2000+ presets, active) | `apps/web` |
| `audiobuffer-to-wav` | WAV encoding | `apps/web` |

No additional type packages needed — WebAudioFont ships its own types.
