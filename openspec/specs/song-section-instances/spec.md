### Requirement: Create section instance
A user SHALL be able to place a section definition into a song's structure by creating an instance with a `start_measure` and `length_measures`.

#### Scenario: Create instance at end of structure
- **WHEN** user adds a section instance
- **THEN** it is created with `start_measure` set to the end of the last existing instance (or 1.0 if none), and a default `length_measures` of 8

#### Scenario: Create instance with lyrics override
- **WHEN** user creates an instance and provides a `lyrics_override`
- **THEN** the instance displays the override text instead of the definition's canonical lyrics

#### Scenario: Create instance without lyrics override
- **WHEN** `lyrics_override` is null or omitted
- **THEN** the instance displays the definition's canonical lyrics

### Requirement: Reorder section instances
A user SHALL be able to reorder section instances; `start_measure` values SHALL be updated to reflect the new order.

#### Scenario: Move instance up in sequence
- **WHEN** user moves an instance to an earlier position in the sequence
- **THEN** the `start_measure` values of all affected instances are updated to maintain contiguous, non-overlapping positions

#### Scenario: Order on song page matches DAW order
- **WHEN** instances are sorted by `start_measure` ascending
- **THEN** the resulting sequence matches the order displayed on both the song page and (future) DAW structure lane

### Requirement: Update section instance
A user SHALL be able to update an instance's `lyrics_override`, `start_measure`, and `length_measures`.

#### Scenario: Set lyrics override
- **WHEN** user sets a per-instance lyric text
- **THEN** that text is used for display instead of the definition's canonical lyrics

#### Scenario: Clear lyrics override
- **WHEN** user clears the instance's lyrics override (sets to null)
- **THEN** the definition's canonical lyrics are restored for that instance

### Requirement: Delete section instance
A user SHALL be able to remove a single instance from the song structure without affecting the definition or other instances.

#### Scenario: Delete single instance
- **WHEN** user deletes an instance
- **THEN** only that instance is removed; the definition and other instances are unchanged

### Requirement: List section instances for a song
The system SHALL return all section instances for a given song, ordered by `start_measure` ascending, with their associated definition data included.

#### Scenario: Returns instances with definition
- **WHEN** listing instances for a song
- **THEN** each instance includes its definition's name, color, chords, and canonical lyrics alongside the instance's own fields
