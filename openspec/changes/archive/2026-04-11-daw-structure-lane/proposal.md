## Why

The DAW currently has no connection to the song's structural data (sections, chords) that users define on the song page. Users must mentally cross-reference two separate views to understand where sections fall on the timeline, making arrangement work error-prone.

## What Changes

- A new read-only **structure lane** is added at the top of the DAW track list, displaying each `song_section_instance` as a labeled block spanning its measure range.
- Each block shows the section name, color, and chord progression from the associated `song_section_definition`.
- The lane is purely presentational — editing structure/chords remains on the song page.
- The DAW fetches section instances (with definition data) for the current song when it opens.

## Capabilities

### New Capabilities

- `daw-structure-lane`: A fixed, read-only lane rendered above the track rows in the DAW that visualizes section instances on the measure timeline, including section name, color, and chords.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. The existing section-instance ordering guarantee ("Order on song page matches DAW order") referenced in song-section-instances already anticipates DAW use. -->

## Impact

- `apps/web`: New `StructureLane` component in the DAW view; existing tRPC hook for listing section instances (with definitions) reused or added.
- `apps/api`: No new endpoints required — the existing `sectionInstance.list` procedure (returns instances with definition data) already covers this.
- `packages/domain` / `packages/app`: No changes — purely a read path already supported.
- No DB schema changes.
