## Context

Songs currently store only metadata (name, BPM, key, description). The DAW operates on tracks and clips. There is no concept of song sections, lyrics, or chords anywhere in the system. This change introduces that layer: a structured, editable representation of a song's harmonic and lyrical content, anchored to the DAW timeline via measure positions.

The existing song landing page (`$songSlug/index.tsx`) is sparse — name, BPM, key, an "Open DAW" button. It becomes the home for this feature.

## Goals / Non-Goals

**Goals:**
- Section definitions: named, colored section templates per song with chords and canonical lyrics
- Section instances: ordered placements of definitions, with per-instance lyrics overrides and DAW measure positions (`start_measure`, `length_measures`)
- Full CRUD for definitions and instances via tRPC
- Song landing page editor: add/reorder sections, inline lyrics editing, chord entry
- View mode toggle: Lyrics + Chords / Lyrics only / Chords only
- `start_measure` as the single source of truth for section order (shared between song page and future DAW integration)

**Non-Goals:**
- DAW structure lane visualization (Change 2)
- Chord highlight during DAW playback (Change 2)
- Comments / suggestion mode (future change)
- Real-time collaborative editing

## Decisions

### D1: Two-table model (definition + instance) over a flat `song_section` table

**Decision**: Introduce `song_section_definition` (the template) and `song_section_instance` (the placement).

**Rationale**: Musicians think in terms of repeating sections. Chorus chords/lyrics are defined once; changes propagate to all occurrences. Verses share chords but can carry per-instance lyrics. A flat table would require duplicating chord data and make "edit once, update all" impossible.

**Alternative considered**: Single flat table with optional `template_id`. Rejected because it blurs the definition/instance boundary and makes propagation logic awkward.

### D2: Chord progression stored as JSONB on the definition

**Decision**: `chords JSONB` — an ordered array of `{ at: float, chord: string }` where `at` is the measure offset within the section (1.0 = start of measure 1, 1.5 = halfway through, i.e. half-measure passing chords).

```json
[
  { "at": 1.0, "chord": "Am" },
  { "at": 1.5, "chord": "G" },
  { "at": 2.0, "chord": "F" },
  { "at": 2.5, "chord": "C" }
]
```

**Rationale**: Flexible enough for half-measure passing chords. Relative to the section so it works regardless of where the section is placed in the timeline. The pattern repeats for the full `length_measures` of the instance.

**Alternative considered**: Plain text (e.g. `"Am G F C"`). Rejected because it can't encode timing granularity needed for DAW chord highlighting in Change 2.

### D3: `start_measure` as source of truth for order

**Decision**: Both song page and DAW use `start_measure` to determine section order. The song page sorts instances by `start_measure`. No separate `order` integer.

**Rationale**: Keeps the two surfaces in sync automatically. Moving a section in the DAW (Change 2) updates `start_measure`; the song page reorders without any additional work.

**Trade-off**: In Change 1 (before DAW UI), users reorder sections on the song page — this updates `start_measure` values. The implementation must handle reorder by shifting `start_measure` values (e.g. swap or redistribute). Sections default to contiguous positions (instance 1 at 1.0, instance 2 at `1.0 + length_measures`, etc.).

### D4: Instance lyrics override — null means "use definition"

**Decision**: `lyrics_override` is nullable. `null` means render the definition's canonical lyrics. A non-null string fully replaces them for that instance.

**Rationale**: Simple, no extra join needed. Chorus instances will typically have `lyrics_override = null`. Verse 2 will have its own text.

### D5: Section color stored on the definition as a CSS hex string

**Decision**: `color text` on `song_section_definition`, e.g. `"#7C3AED"`. Null = system default color assigned by position.

**Rationale**: Needed for DAW lane visualization in Change 2. Cheap to store now.

### D6: Use cases in modules layer, not packages/app

**Decision**: New use-case factories go in the existing modules pattern (`@echo/modules/song/use-cases` as seen in `apps/api/src/router/organizations/song.ts`) rather than a new `packages/app` package.

**Rationale**: Consistent with how existing song use cases are structured.

## Risks / Trade-offs

- **`start_measure` reordering complexity** → Mitigation: on song page reorder, redistribute start_measures in integer steps (e.g. 1, 9, 17 with `length_measures = 8`). Keep gaps to avoid collisions. DAW integration (Change 2) will refine positioning.
- **Chord JSONB validation** → Mitigation: validate schema with Zod at the tRPC input layer before writing to DB.
- **Large lyrics per song** → Not a concern at this scale; text columns are fine.

## Migration Plan

1. Add migration `packages/db/migrations/<timestamp>_create-song-sections.ts`: creates `song_section_definition` and `song_section_instance` tables.
2. Run `pnpm --filter @echo/db migrate` to apply.
3. Regenerate `schema.d.ts` (`pnpm --filter @echo/db generate`).
4. No data migration needed (new tables, no existing data to transform).
5. Rollback: drop both tables (no FK dependencies from existing tables).

## Open Questions

- Should section names be free-form text only, or should there be suggested presets (Intro, Verse, Chorus, Bridge, Outro, Buildup) shown as quick-pick options in the UI? (Recommendation: free-form with UI presets as shortcuts)
- Should `length_measures` default to the song's time signature (e.g. 8 measures) or be required on creation?
