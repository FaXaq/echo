# Data Model: Web DAW Enhancements

**Feature**: 001-daw-enhancements
**Date**: 2026-03-16

---

## Schema Changes

### 1. Modified: `track.volume` — dB scale

**Before**: `volume INTEGER DEFAULT 100` (linear 0–100, used as `volume / 100` for gain)
**After**: `volume FLOAT DEFAULT 0.0` (dB scale, range −60.0 to +6.0, 0.0 = unity gain)

**Migration**: Convert existing values with:
```sql
UPDATE track
SET volume = CASE
  WHEN volume = 0 THEN -60.0
  ELSE 20.0 * LOG(volume::float / 100.0) / LOG(10.0)
END;
ALTER TABLE track ALTER COLUMN volume TYPE FLOAT USING volume::float;
ALTER TABLE track ALTER COLUMN volume SET DEFAULT 0.0;
```

**Validation**: `volume >= -60.0 AND volume <= 6.0`

---

### 2. New column: `track.instrument_preset`

Stores the GM program number for MIDI playback on this track.

```sql
ALTER TABLE track ADD COLUMN instrument_preset INTEGER NULL;
-- NULL = default (program 0, Acoustic Grand Piano)
-- Range: 0–127 (General MIDI programs)
```

**Domain constraint**: 0 ≤ instrument_preset ≤ 127 when not null.

---

### 3. New table: `midi_clip`

Stores MIDI clips on the timeline, analogous to `audio_clip`.

```sql
CREATE TABLE midi_clip (
  id             TEXT        NOT NULL PRIMARY KEY,
  track_id       TEXT        NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  file_id        TEXT        NOT NULL REFERENCES file(id) ON DELETE RESTRICT,
  name           TEXT            NULL,
  start_measure  FLOAT       NOT NULL DEFAULT 1.0,
  duration_ms    INTEGER         NULL,  -- total duration from MIDI file header
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notes**:
- `file.type` will be `'midi'` for files referenced by `midi_clip`
- `start_measure` uses the same unit as `audio_clip.start_measure` (1-indexed, fractional quarters allowed)
- `duration_ms` is computed from the MIDI file at upload time (total length of the parsed MIDI)
- Deleting a track cascades to both `audio_clip` and `midi_clip`

---

## Updated Domain Types

### Track (updated)

```typescript
// packages/domain/src/track/index.ts
export type Track = {
  id: string;
  songId: string;
  name: string;
  order: number;
  volume: number;           // dB float, -60.0 to +6.0, default 0.0
  instrumentPreset: number | null;  // GM program 0-127, null = piano (0)
  createdAt: Date;
  updatedAt: Date;
};
```

### MidiClip (new)

```typescript
// packages/domain/src/midi-clip/index.ts
export type MidiClipId = string;

export type MidiClip = {
  id: MidiClipId;
  trackId: string;
  fileId: string;
  file: AudioFile;          // reuses AudioFile (file.type = 'midi')
  name: string | null;
  startMeasure: number;
  durationMs: number | null;
  createdAt: Date;
};
```

### FileType (extended)

```typescript
// packages/domain/src/audio-clip/index.ts
export const fileTypeSchema = z.enum(["audio", "midi"]);
export type FileType = z.infer<typeof fileTypeSchema>;
```

---

## Entity Relationships

```
Song
 └── Track (many, ordered)
      ├── AudioClip (many) → File (type='audio')
      └── MidiClip  (many) → File (type='midi')

Track
  .volume             FLOAT  -60.0 to +6.0 dB (default 0.0)
  .instrumentPreset   INT    0-127 GM program (nullable, default null → piano)
```

---

## Ports (Application Layer)

### Updated: `TrackRepoPort`

```typescript
// packages/app/src/ports/track.ts — additions
updateVolume: (trackId: string, volumeDb: number) => Promise<Track>;
setInstrumentPreset: (trackId: string, preset: number | null) => Promise<Track>;
```

### New: `MidiClipRepoPort`

```typescript
// packages/app/src/ports/midi-clip.ts
export interface MidiClipRepoPort {
  listByTrackIds:    (trackIds: string[]) => Promise<MidiClip[]>;
  listBySong:        (songId: string) => Promise<MidiClip[]>;
  create:            (input: CreateMidiClipInput) => Promise<MidiClip>;
  updatePosition:    (clipId: string, startMeasure: number) => Promise<MidiClip>;
  rename:            (clipId: string, name: string) => Promise<MidiClip>;
  delete:            (clipId: string) => Promise<void>;
}

export type CreateMidiClipInput = {
  trackId: string;
  fileId: string;
  startMeasure: number;
  durationMs: number | null;
};
```

---

## Migration File

`packages/db/migrations/20260316000001_daw-enhancements.ts`

Operations (in order):
1. Add `instrument_preset INTEGER NULL` to `track`
2. Alter `track.volume` type to `FLOAT`, convert existing values, set default to 0.0
3. Create `midi_clip` table with all columns and foreign keys
