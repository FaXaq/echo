## 1. Database

- [x] 1.1 Create migration `packages/db/migrations/<timestamp>_create-song-sections.ts` — `song_section_definition` table (id, song_id, name, chords JSONB, lyrics text, color text, created_at, updated_at)
- [x] 1.2 Add `song_section_instance` table to the same migration (id, song_id, definition_id FK → song_section_definition with CASCADE DELETE, start_measure float, length_measures float, lyrics_override text, created_at, updated_at)
- [x] 1.3 Run `pnpm --filter @echo/db migrate` and regenerate `packages/db/src/schema.d.ts`

## 2. Domain / Use Cases

- [x] 2.1 Add `SongSectionDefinition` and `SongSectionInstance` types to the modules song domain layer
- [x] 2.2 Implement `makeCreateSectionDefinition` use case
- [x] 2.3 Implement `makeUpdateSectionDefinition` use case
- [x] 2.4 Implement `makeDeleteSectionDefinition` use case
- [x] 2.5 Implement `makeListSectionDefinitions` use case
- [x] 2.6 Implement `makeCreateSectionInstance` use case (appends at end, default `length_measures = 8`)
- [x] 2.7 Implement `makeUpdateSectionInstance` use case (lyrics_override, start_measure, length_measures)
- [x] 2.8 Implement `makeDeleteSectionInstance` use case
- [x] 2.9 Implement `makeListSectionInstances` use case (returns instances joined with definition data, ordered by start_measure)
- [x] 2.10 Implement `makeReorderSectionInstances` use case (accepts ordered array of instance IDs, redistributes start_measure values in steps of `length_measures`)

## 3. API

- [x] 3.1 Add section definition repo adapter in `apps/api/src/adapters` (Kysely queries for CRUD)
- [x] 3.2 Add section instance repo adapter (Kysely queries including join with definition)
- [x] 3.3 Add `ctx.songSection` (definition repo + instance repo) to tRPC context in `apps/api/src/context.ts`
- [x] 3.4 Create `apps/api/src/router/organizations/song-section.ts` with sub-router: `definition.create`, `definition.update`, `definition.delete`, `definition.list`, `instance.create`, `instance.update`, `instance.delete`, `instance.list`, `instance.reorder`
- [x] 3.5 Validate chord JSONB input with Zod (`z.array(z.object({ at: z.number().min(0.5), chord: z.string().min(1) }))`)
- [x] 3.6 Compose `makeSongSectionRouter()` into the organizations song router in `apps/api/src/router/organizations/song.ts`

## 4. Frontend — Structure Display

- [x] 4.1 Add tRPC query `organization.song.section.instance.list` call in the song page loader (`$songSlug/index.tsx`)
- [x] 4.2 Create `-section-card.tsx`: displays section name (colored badge), chords row, and lyrics block; accepts `viewMode` prop
- [x] 4.3 Create `-view-mode-toggle.tsx`: segmented control for Lyrics + Chords / Lyrics only / Chords only; stores selection in local component state
- [x] 4.4 Render section cards in `start_measure` order on the song landing page with the view mode toggle in the header

## 5. Frontend — Section Editing

- [x] 5.1 Create `-add-section-dialog.tsx`: form to create a new definition or pick an existing one; quick-pick preset buttons (Intro, Verse, Chorus, Bridge, Outro, Buildup)
- [x] 5.2 Wire "Add section" button to `-add-section-dialog.tsx`; on confirm call `instance.create` mutation and invalidate list query
- [x] 5.3 Add inline lyrics editor to `-section-card.tsx`: click lyrics area → textarea; on blur, if instance has no override prompt "edit canonical or override?", call appropriate mutation
- [x] 5.4 Add inline chord editor to `-section-card.tsx`: click chord area → text input (format: `Am@1.0, G@1.5, F@2.0, C@2.5`); parse input and call `definition.update`
- [x] 5.5 Add color picker to section definition editing (simple palette of 8 preset colors)
- [x] 5.6 Implement drag-to-reorder with `@dnd-kit/sortable` (already used in DAW); on drop call `instance.reorder` mutation
- [x] 5.7 Add delete button to each section card with confirmation dialog (`AlertDialog` from shadcn/ui); call `instance.delete` mutation

## 6. Translations

- [x] 6.1 Add all new user-visible strings to `packages/i18n/locales/en.json` under a `"songs"` namespace (Add section, Edit lyrics, Edit chords, Lyrics + Chords, Lyrics only, Chords only, Edit canonical lyrics, Override for this instance, Remove section, etc.)
- [x] 6.2 Add French translations for the same keys in `packages/i18n/locales/fr.json`
