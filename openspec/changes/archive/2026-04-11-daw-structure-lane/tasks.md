## 1. Component: DawStructureLane

- [x] 1.1 Create `-daw-structure-lane.tsx` in the DAW route directory; add a `STRUCTURE_LANE_HEIGHT` constant to `-constants.ts`
- [x] 1.2 Fetch section instances with `trpc.organization.song.section.instance.list.useQuery({ songId })` inside the component; use `song` from `useDawContext()`
- [x] 1.3 Render one block per instance, positioned with `left: (instance.startMeasure - 1) * PIXELS_PER_MEASURE` and `width: instance.lengthMeasures * PIXELS_PER_MEASURE`
- [x] 1.4 Apply the definition's `color` as the block background (with a neutral fallback for null)
- [x] 1.5 Show the section name as the primary text label inside the block (truncated with ellipsis)
- [x] 1.6 Show chord names as an abbreviated secondary line (e.g. `Am · G · F · C`), hidden when block pixel width is below a legible threshold (e.g. 60 px)
- [x] 1.7 Make the lane non-interactive (no click/drag handlers) — pointer-events none on blocks

## 2. Integration: Timeline

- [x] 2.1 In `-timeline.tsx`, conditionally render `<DawStructureLane>` between the ruler and the track rows when instances exist; pass it into the shared horizontal scroll container so it scrolls in sync
- [x] 2.2 Add a "Structure" label in the left panel column opposite the lane, styled consistently with track header labels, and only visible when the lane is rendered

## 3. i18n

- [x] 3.1 Add the "Structure" label key to the `songs` namespace in all locale files (`packages/i18n/locales/en.json`, `fr.json`); use `<Trans t={t}>Structure</Trans>` in the component

## 4. Storybook

- [x] 4.1 Add a `-daw-structure-lane.stories.tsx` file with stories covering: empty state (no instances), single instance with chords, multiple instances with mixed colors, narrow block (chords hidden)
