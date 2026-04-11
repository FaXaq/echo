### Requirement: Display song structure on landing page
The song landing page SHALL display all section instances in `start_measure` order, each showing the section name, chords, and lyrics according to the active view mode.

#### Scenario: Sections shown in timeline order
- **WHEN** a song has section instances
- **THEN** they are displayed in ascending `start_measure` order on the song landing page

#### Scenario: Instance lyrics override takes precedence
- **WHEN** an instance has a non-null `lyrics_override`
- **THEN** the override text is shown instead of the definition's canonical lyrics

### Requirement: View mode toggle
The song landing page SHALL provide a toggle allowing users to switch between three display modes: **Lyrics + Chords**, **Lyrics only**, and **Chords only**.

#### Scenario: Lyrics + Chords mode
- **WHEN** view mode is "Lyrics + Chords"
- **THEN** each section displays both the chord progression and the lyrics text

#### Scenario: Lyrics only mode
- **WHEN** view mode is "Lyrics only"
- **THEN** each section displays only lyrics; chords are hidden

#### Scenario: Chords only mode
- **WHEN** view mode is "Chords only"
- **THEN** each section displays only the chord progression; lyrics are hidden

#### Scenario: View mode persists during session
- **WHEN** user changes view mode
- **THEN** the selected mode remains active while navigating within the page

### Requirement: Add section to structure
A user SHALL be able to add a new section to the song structure from the song landing page.

#### Scenario: Create new definition and add instance
- **WHEN** user adds a new section
- **THEN** they can enter a name (with quick-pick presets: Intro, Verse, Chorus, Bridge, Outro, Buildup) and the section is appended at the end of the structure

#### Scenario: Reuse existing definition
- **WHEN** user adds a section and selects an existing definition (e.g. "Chorus")
- **THEN** a new instance of that definition is created and appended

### Requirement: Edit section lyrics inline
A user SHALL be able to edit the lyrics of a section directly on the song landing page without navigating away.

#### Scenario: Edit instance lyrics
- **WHEN** user clicks the lyrics area of an instance
- **THEN** a text area becomes editable for that instance's lyrics override

#### Scenario: Edit canonical lyrics from instance
- **WHEN** the instance has no lyrics override and user edits
- **THEN** user is given a choice: edit canonical (updates definition, affects all instances) or override for this instance only

#### Scenario: Save on blur
- **WHEN** user clicks away from the lyrics editor
- **THEN** changes are saved automatically

### Requirement: Edit section chords
A user SHALL be able to edit the chord progression of a section definition from the song landing page.

#### Scenario: Open chord editor for a section
- **WHEN** user clicks the chord area of a section
- **THEN** an inline editor allows entering chords with measure positions (e.g. "Am@1.0, G@1.5, F@2.0, C@2.5")

#### Scenario: Chord change updates all instances
- **WHEN** user updates chords on a definition
- **THEN** all instances of that definition reflect the updated chords immediately

### Requirement: Reorder sections
A user SHALL be able to reorder sections on the song landing page via drag-and-drop.

#### Scenario: Drag to reorder
- **WHEN** user drags a section to a new position
- **THEN** `start_measure` values are updated and the page reflects the new order

### Requirement: Delete section instance from song page
A user SHALL be able to remove a section instance from the song structure.

#### Scenario: Remove instance with confirmation
- **WHEN** user deletes a section instance
- **THEN** a confirmation prompt is shown before the instance is removed; the definition is preserved
