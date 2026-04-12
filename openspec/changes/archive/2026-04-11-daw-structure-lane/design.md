## Context

The DAW (`-daw.tsx` + `-timeline.tsx`) renders a `<Timeline>` component that shows a ruler and a list of `DawTrackRow` components. Section instances and their definitions are already persisted and served via `trpc.organization.songSection.instance.list`. The song page already displays this data; the DAW currently does not.

## Goals / Non-Goals

**Goals:**
- Render a fixed "structure lane" above the track rows in `<Timeline>` showing section instances as colored blocks positioned by `start_measure`.
- Each block shows the section name, color, and abbreviated chord labels.
- The lane uses the same pixel-per-measure scale as the rest of the timeline so blocks align with the ruler and track clips.
- Fetch section instances (with definition data) inside the DAW using the existing tRPC query.

**Non-Goals:**
- Editing structure or chords from the DAW.
- Playback scrubbing via the structure lane.
- Synchronized scrolling between the song page and the DAW.
- Resizing or reordering instances from the DAW.

## Decisions

### 1. Fetch instances inside the DAW, not from the route loader

**Decision**: Call `trpc.organization.songSection.instance.list` with a `useQuery` hook inside a new `-daw-structure-lane.tsx` component (or inside `Timeline`), passing `song.id`.

**Rationale**: The structure data is optional supplementary context — a loading state or empty result should degrade gracefully without blocking the DAW from opening. Fetching in the route loader would couple DAW load time to structure data availability.

**Alternative considered**: Fetch in the route loader and pass as a prop (like `initialTracks`). Rejected because it adds mandatory latency to DAW opening and changes the `DawProps` interface for a read-only concern.

### 2. Structure lane as a sibling of the ruler in Timeline

**Decision**: Render `<DawStructureLane>` directly inside `<Timeline>`, between the ruler and the track rows, sharing the same scroll container.

**Rationale**: The lane must scroll horizontally in sync with the tracks and align with the ruler ticks — both require being in the same scroll container. The left panel column (track headers) should show a fixed "Structure" label opposite the lane.

**Alternative considered**: Render the lane outside the scroll container and use JS-synced scroll. Rejected — needless complexity.

### 3. Chord display: abbreviated inline text

**Decision**: Render chords as a compact single line inside the block (e.g. `Am · G · F · C`), truncated with ellipsis if the block is too narrow.

**Rationale**: Chord positions (`at` values) are measure-relative within a definition. Rendering them as full sub-blocks inside a structure lane block adds significant complexity for marginal benefit — users can see the full chords on the song page.

## Risks / Trade-offs

- [Block overlap] If section instances overlap (which the current data model permits by not enforcing contiguity), blocks will visually overlap. → Accept: the lane is read-only; users fix structure on the song page.
- [Narrow blocks] Very short sections may not have enough width to show name + chords. → Mitigation: truncate text with CSS `overflow-hidden text-ellipsis whitespace-nowrap`; hide chords below a minimum block width threshold.
- [Empty state] Songs with no section instances show an empty lane. → Show a subtle empty state ("No structure defined") or simply render nothing and omit the lane row.
