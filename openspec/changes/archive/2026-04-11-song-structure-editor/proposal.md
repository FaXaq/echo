## Why

Songs in Echo have metadata (BPM, key) but no way to capture their lyrical and harmonic structure. Musicians need a place to write lyrics, define song sections (verse, chorus, bridge, etc.), and attach chords — all linked to the DAW timeline — so the song page becomes a useful creative hub, not just a launch pad for the DAW.

## What Changes

- New `song_section_definition` table: named section templates (e.g. "Chorus", "Verse", "Bridge") per song, each with a color, canonical lyrics, and a chord progression stored as JSONB
- New `song_section_instance` table: ordered placements of definitions within a song, with `start_measure` as the source of truth for order, optional per-instance lyrics override, and DAW-ready positioning fields (`start_measure`, `length_measures`)
- New tRPC procedures under `organization.song.section` for CRUD on definitions and instances
- Song landing page gains a structure editor: add/reorder sections, edit lyrics inline, enter chords per section
- View mode toggle on the song page: **Lyrics + Chords** / **Lyrics only** / **Chords only**

## Capabilities

### New Capabilities

- `song-section-definitions`: Creating, editing, and deleting named section definitions (name, color, chords, canonical lyrics) scoped to a song
- `song-section-instances`: Composing a song's structure by placing section definitions in order, with per-instance lyrics overrides and DAW-ready measure positions
- `song-structure-editor-ui`: The song landing page editor — add/reorder sections, inline lyrics editing, chord entry, view mode toggle

### Modified Capabilities

<!-- none -->

## Impact

- **DB**: 2 new tables (`song_section_definition`, `song_section_instance`), 2 new migrations in `packages/db`
- **API**: New `section` sub-router under `apps/api/src/router/organizations/song.ts`; new use-case factories in the modules layer
- **Frontend**: `apps/web/src/routes/.../songs/$songSlug/index.tsx` expanded significantly; new co-located components
- **No breaking changes** to existing song endpoints
