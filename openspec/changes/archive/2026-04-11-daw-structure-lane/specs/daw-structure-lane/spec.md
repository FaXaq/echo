## ADDED Requirements

### Requirement: Display structure lane in the DAW
The DAW SHALL render a read-only structure lane above the track rows, showing all section instances for the current song positioned on the measure timeline.

#### Scenario: Lane appears when instances exist
- **WHEN** the DAW opens for a song that has at least one section instance
- **THEN** a structure lane row is rendered above the first track row, containing one block per section instance

#### Scenario: Lane is absent when no instances exist
- **WHEN** the DAW opens for a song that has no section instances
- **THEN** no structure lane row is rendered and the track area begins at the same position as before

#### Scenario: Lane aligns with ruler
- **WHEN** the structure lane is displayed
- **THEN** each block's left edge aligns with its `start_measure` position and its right edge aligns with `start_measure + length_measures`, using the same pixels-per-measure scale as the ruler

### Requirement: Structure lane block content
Each section block in the structure lane SHALL display the section name, section color, and chord progression from its associated definition.

#### Scenario: Block shows section name and color
- **WHEN** a section instance is rendered in the lane
- **THEN** the block background uses the definition's `color` (or a neutral fallback if null) and the section name is shown as text inside the block

#### Scenario: Block shows chords
- **WHEN** the definition has a non-empty `chords` array
- **THEN** the chord names are displayed as a single abbreviated line inside the block (e.g. `Am · G · F · C`)

#### Scenario: Block hides chords when too narrow
- **WHEN** a block's rendered pixel width is below a minimum legible threshold
- **THEN** only the section name is shown; chord text is hidden

#### Scenario: Block text truncates when it overflows
- **WHEN** the section name or chord text is wider than the block
- **THEN** the text is truncated with an ellipsis and does not overflow the block boundary

### Requirement: Structure lane scrolls with the timeline
The structure lane SHALL scroll horizontally in sync with the ruler and track rows.

#### Scenario: Horizontal scroll is synchronized
- **WHEN** the user scrolls the timeline horizontally
- **THEN** the structure lane scrolls at the same rate as the ruler and track clip area

### Requirement: Structure lane header label
The left panel column opposite the structure lane SHALL display a static "Structure" label.

#### Scenario: Label shown in header panel
- **WHEN** the structure lane is visible
- **THEN** a "Structure" label appears in the left panel column at the same vertical position as the lane, matching the style of track headers

### Requirement: Structure lane is read-only
The structure lane SHALL not allow editing of section data from within the DAW.

#### Scenario: No interaction triggers editing
- **WHEN** the user clicks or interacts with a section block in the structure lane
- **THEN** no edit UI is presented; the DAW state is unchanged
