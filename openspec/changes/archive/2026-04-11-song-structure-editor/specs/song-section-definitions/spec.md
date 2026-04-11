## ADDED Requirements

### Requirement: Create section definition
A user SHALL be able to create a named section definition for a song, providing a name, optional color, optional canonical lyrics, and an optional chord progression.

#### Scenario: Create definition with name only
- **WHEN** user creates a section definition with just a name (e.g. "Chorus")
- **THEN** a `song_section_definition` record is created with `chords = []`, `lyrics = null`, `color = null`

#### Scenario: Create definition with chords
- **WHEN** user creates a section definition with a chord array (e.g. `[{at: 1.0, chord: "Am"}, {at: 2.0, chord: "G"}]`)
- **THEN** the chord array is persisted as JSONB on the definition

#### Scenario: Chord timing out of range rejected
- **WHEN** a chord entry has `at < 1.0` or a non-positive value
- **THEN** the API returns a validation error

### Requirement: Update section definition
A user SHALL be able to update any field of a section definition (name, color, lyrics, chords).

#### Scenario: Update propagates to all instances
- **WHEN** a definition's canonical `lyrics` is updated
- **THEN** all section instances with `lyrics_override = null` display the new lyrics

#### Scenario: Update chords
- **WHEN** a definition's chords are updated
- **THEN** all instances referencing that definition use the new chord progression

### Requirement: Delete section definition
A user SHALL be able to delete a section definition; all associated instances SHALL be cascade-deleted.

#### Scenario: Delete removes instances
- **WHEN** a definition is deleted
- **THEN** all `song_section_instance` rows referencing it are also deleted

### Requirement: List section definitions for a song
The system SHALL return all section definitions for a given song.

#### Scenario: Returns definitions ordered by name
- **WHEN** listing definitions for a song
- **THEN** the response includes all definitions for that song
