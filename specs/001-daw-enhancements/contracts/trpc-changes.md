# tRPC Contract Changes: Web DAW Enhancements

**Feature**: 001-daw-enhancements
**Date**: 2026-03-16

All procedures live under `organization.*` and require `authedProcedure`.

---

## Changed Procedures

### `organization.track.updateVolume`

**Change**: `volume` input type changes from integer (0–100) to float (dB, −60.0 to +6.0).

```typescript
// Input (before)
{ trackId: string; volume: number }  // 0–100

// Input (after)
{ trackId: string; volumeDb: number }  // -60.0 to +6.0

// Output (unchanged shape, but volume field is now dB)
Track  // with volume: number (dB)
```

**Validation**: `z.number().min(-60).max(6)`

**Breaking change**: Yes — the field is renamed `volume` → `volumeDb` and the range changes. All frontend callers must be updated.

---

## New Procedures

### `organization.track.setInstrumentPreset`

Sets the GM instrument preset for a track. Used when the user changes the sound for a MIDI track.

```typescript
// Input
{ trackId: string; preset: number | null }
// preset: GM program 0-127, or null to reset to default (Acoustic Grand Piano)

// Output
Track  // with instrumentPreset: number | null

// Validation
preset: z.number().int().min(0).max(127).nullable()
```

---

### `organization.midiClip.register`

Registers a MIDI clip after the file has been uploaded to storage (same two-step flow as audio clips).

```typescript
// Input
{
  trackId:      string;
  filename:     string;
  storageKey:   string;
  organizationId: string;
  startMeasure: number;   // 1.0+, fractional quarters allowed
  durationMs:   number | null;
}

// Output
MidiClip  // full clip with nested file
```

---

### `organization.midiClip.listBySong`

Returns all MIDI clips for a song (across all tracks). Used alongside `audioClip.listBySong` to populate the timeline.

```typescript
// Input
{ songId: string }

// Output
MidiClip[]  // sorted by startMeasure ascending
```

---

### `organization.midiClip.updatePosition`

Moves a MIDI clip to a new measure. Mirrors `audioClip.updatePosition`.

```typescript
// Input
{ clipId: string; startMeasure: number }
// startMeasure: >= 1.0, fractional quarters allowed

// Output
MidiClip
```

---

### `organization.midiClip.rename`

Renames a MIDI clip. Mirrors `audioClip.rename`.

```typescript
// Input
{ clipId: string; name: string }
// name: non-empty string, max 255 chars

// Output
MidiClip
```

---

### `organization.midiClip.delete`

Deletes a MIDI clip from the timeline (does not delete the underlying file).

```typescript
// Input
{ clipId: string }

// Output
void
```

---

### `organization.midiClip.getDownloadUrls`

Returns signed download URLs for MIDI files. Used to provide the MIDI ArrayBuffer to the browser for parsing and playback. Mirrors `audioClip.getDownloadUrls`.

```typescript
// Input
{ storageKeys: string[] }

// Output
{ key: string; url: string }[]
```

---

## Unchanged Procedures

These procedures are unaffected and require no modifications:

- `organization.audioClip.getUploadUrl` — reused for MIDI file uploads (same S3 flow, `contentType: 'audio/midi'` or `'application/octet-stream'`)
- `organization.audioClip.register` — unchanged
- `organization.audioClip.getDownloadUrls` — unchanged (used for individual clip export)
- `organization.audioClip.updatePosition` — unchanged
- `organization.audioClip.rename` — unchanged
- `organization.audioClip.delete` — unchanged
- `organization.track.create` — unchanged
- `organization.track.delete` — unchanged
- `organization.track.rename` — unchanged
- `organization.track.list` — unchanged shape (volume field now returns dB float)
- `organization.song.get` — unchanged
