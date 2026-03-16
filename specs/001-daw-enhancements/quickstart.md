# Quickstart: Web DAW Enhancements

**Feature**: 001-daw-enhancements
**Branch**: `001-daw-enhancements`

## Prerequisites

- Dev environment running (`pnpm dev`)
- PostgreSQL running locally or via Docker

## Install New Dependencies

```bash
# From repo root
pnpm --filter @echo/web add tone @tonejs/midi webaudiofont audiobuffer-to-wav
```

Add types if not bundled:
```bash
pnpm --filter @echo/web add -D @types/soundfont-player
```

## Run the Migration

```bash
pnpm --filter @echo/db migrate
```

This migration:
1. Converts `track.volume` from INTEGER (0–100) to FLOAT (dB, −60 to +6)
2. Adds `track.instrument_preset INTEGER NULL`
3. Creates the `midi_clip` table

After migration, regenerate the Kysely schema:
```bash
pnpm --filter @echo/db generate
```

## Verify the Schema

```sql
-- Check track.volume is now FLOAT with dB values
SELECT id, name, volume FROM track LIMIT 5;
-- Expected: volume values like -6.02, 0.0, etc. (not 50, 100)

-- Check new column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'track' AND column_name IN ('volume', 'instrument_preset');

-- Check midi_clip table exists
\d midi_clip
```

## Key Implementation Notes

### Tone.js in React

Always store Tone.js instances in refs:
```typescript
const transportRef = useRef<ReturnType<typeof Tone.getTransport> | null>(null);
const playersRef = useRef<Map<string, Tone.Player>>(new Map());
const volumesRef = useRef<Map<string, Tone.Volume>>(new Map());
```

Always call `await Tone.start()` inside the user gesture handler (play button click) — not in useEffect.

### dB ↔ Gain Conversion

```typescript
// dB → Web Audio gain
const gain = Tone.dbToGain(track.volume);  // e.g., 0 dB → 1.0, -6 dB → 0.5

// Web Audio gain → dB (for migration calculations)
const db = Tone.gainToDb(linearGain);

// Manual formulas (if not using Tone.js outside playback context)
const gainFromDb = (db: number) => Math.pow(10, db / 20);
const dbFromGain = (gain: number) => 20 * Math.log10(gain);
```

### Clip Repositioning Pattern

```typescript
// In handlePlay: store player ref by clip ID
const player = new Tone.Player({ url: downloadUrl });
player.sync().start(clipStartSeconds);
playersRef.current.set(clip.id, player);

// In onClipPositionChanged (during playback):
const player = playersRef.current.get(clip.id);
if (player && isPlaying) {
  const newStartSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
  const currentSeconds = Tone.getTransport().seconds;
  player.stop();
  player.unsync();
  if (newStartSeconds > currentSeconds) {
    player.sync().start(newStartSeconds);
  }
}
```

### Individual Clip Export

```typescript
const handleExportClip = async (clip: AudioClip, downloadUrl: string) => {
  const response = await fetch(downloadUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = clip.file.filename.split('.').pop() ?? 'mp3';
  const name = clip.name ?? stripExtension(clip.file.filename);
  a.download = `${name}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

### Song Export

```typescript
import toWav from 'audiobuffer-to-wav';

const handleExport = async () => {
  const durationSeconds = /* calculate from clips */;
  const buffer = await Tone.Offline(async () => {
    // schedule all clips inside here — same logic as handlePlay
    Tone.getTransport().start();
  }, durationSeconds);

  const wav = toWav(buffer.get()!);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${song.name}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

## Running Tests

```bash
pnpm test
```

Domain and app layer use cases have pure unit tests (no mocks for domain, in-memory fakes for ports).
