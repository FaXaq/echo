# Feature Specification: Web DAW Enhancements

**Feature Branch**: `001-daw-enhancements`
**Created**: 2026-03-16
**Status**: Draft
**Input**: User description: "Now that I have a low functionality web daw i want a few things inside daw: 1. move audio files even during play, 2. volume in dB actually tied to audio, 3. insert midi files & play presets, 4. export files"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clip Repositioning During Playback (Priority: P1)

A musician is arranging a song. While the track is playing, they drag an audio clip from measure 3 to measure 5 to hear how it sounds in the new position. The playback continues uninterrupted and the clip starts playing from its new position immediately — no need to stop and restart.

**Why this priority**: This is a foundational DAW interaction. Arranging audio while listening is critical to a productive workflow — stopping playback each time breaks creative flow. This is the most impactful improvement to usability.

**Independent Test**: A song with at least one audio clip can be played back, and dragging the clip to a new measure position takes effect immediately without stopping playback.

**Acceptance Scenarios**:

1. **Given** the DAW is playing a song with clips, **When** the user drags a clip to a new measure position, **Then** the clip begins playing from its new position without playback stopping
2. **Given** the DAW is playing, **When** a clip is moved to a measure position that has already passed in the current playback, **Then** the clip does not play again until playback restarts
3. **Given** the DAW is stopped, **When** the user moves a clip, **Then** the clip starts at the new position on next play (existing behavior preserved)
4. **Given** a clip is moved during playback, **When** the user stops and restarts playback, **Then** the new position is persisted

---

### User Story 2 - dB Volume Control (Priority: P2)

A music producer adjusts the volume of a track. Instead of a percentage slider (0–100), they see a dB-scale slider (e.g., −60 dB to +6 dB) and the volume change is reflected in what they actually hear — moving the slider feels natural and proportional to perceived loudness.

**Why this priority**: Percentage volume is meaningless to musicians. dB is the industry standard for audio gain. Proper logarithmic scaling means volume movements feel natural. Without this, the DAW is not credible as a music production tool.

**Independent Test**: A track volume slider shows dB values. Changing it audibly affects the output. A 6 dB change sounds roughly twice as loud.

**Acceptance Scenarios**:

1. **Given** a track exists, **When** the user views the volume control, **Then** the slider displays the value in dB (e.g., "−6 dB", "0 dB")
2. **Given** a track volume is set to 0 dB, **When** the track plays, **Then** the audio is at unity gain (no amplification or attenuation)
3. **Given** a track volume is set to the minimum value, **When** the track plays, **Then** the audio is inaudible
4. **Given** the user moves the volume slider by a fixed distance at both −20 dB and −6 dB, **Then** the perceived loudness change feels proportional (logarithmic, not linear)
5. **Given** audio is playing, **When** the user adjusts the volume slider, **Then** the output level changes in real time without stopping playback

---

### User Story 3 - MIDI File Import & Preset Playback (Priority: P3)

A composer imports a `.mid` file into a track. The DAW reads the MIDI note data and plays it back using a selected instrument preset (e.g., "Acoustic Grand Piano", "String Ensemble"). The MIDI clip appears on the timeline alongside audio clips. The composer can switch the instrument preset and hear the same notes with a different sound.

**Why this priority**: MIDI support significantly expands the DAW's usefulness for composition. It is higher complexity than the other features (requires MIDI parsing, a synthesizer, and preset management) so it is lower priority than the quick wins above.

**Independent Test**: A `.mid` file can be imported into a track. The MIDI notes play back using a default instrument preset. The track can switch to a different preset and the playback reflects the change.

**Acceptance Scenarios**:

1. **Given** a track exists, **When** the user uploads a `.mid` file, **Then** a MIDI clip appears on the timeline at the chosen measure position
2. **Given** a MIDI clip exists on a track, **When** the song plays, **Then** the MIDI notes are played back using the track's selected instrument preset
3. **Given** a track has a MIDI clip, **When** the user selects a different instrument preset, **Then** subsequent playback uses the new preset sound
4. **Given** a MIDI file is imported, **When** it is displayed on the timeline, **Then** it is visually distinguishable from audio clips
5. **Given** a MIDI clip is on the timeline, **When** the user adjusts track volume, **Then** the MIDI playback volume changes accordingly

---

### User Story 4 - Individual Clip Export via Context Menu (Priority: P4)

A sound designer right-clicks an audio clip on the timeline and selects "Export clip" from a context menu. They receive an immediate download of that single clip's audio file — just the raw clip, no mixing with other tracks.

**Why this priority**: Clip-level export is a quick, high-value action that requires no mixing or rendering — the source file already exists in storage. It is simpler to implement than full song export and independently useful for extracting samples or sharing individual takes.

**Independent Test**: Right-clicking any audio clip and choosing "Export clip" downloads a file. Playing that file in an external player produces exactly the audio in that clip, nothing else.

**Acceptance Scenarios**:

1. **Given** an audio clip exists on the timeline, **When** the user right-clicks it, **Then** a context menu appears containing an "Export clip" option
2. **Given** the context menu is open, **When** the user selects "Export clip", **Then** the clip's audio file is downloaded to the user's device
3. **Given** the downloaded file, **When** played in an external audio player, **Then** it contains only the audio of that clip (not mixed with other tracks)
4. **Given** a clip whose original filename is known, **When** downloaded, **Then** the downloaded filename is derived from the clip name
5. **Given** the context menu is open, **When** the user clicks anywhere outside it, **Then** the menu closes without taking action

---

### User Story 5 - Song Export (Priority: P5)

A musician has finished arranging a song. They click "Export" and receive a downloadable audio file that contains all tracks mixed together at the correct volumes and positions.

**Why this priority**: Full song export is essential for sharing work outside the DAW. It depends on the other features being solid first (correct volumes, correct positioning). Ranked below individual clip export because it is more complex to implement.

**Independent Test**: Clicking export with a song that has at least two audio tracks produces a downloadable audio file. Playing the file in an external player produces the correct mix.

**Acceptance Scenarios**:

1. **Given** a song has one or more tracks with clips, **When** the user initiates export, **Then** a mixed-down audio file is generated and downloaded
2. **Given** a song has multiple tracks at different volumes, **When** exported, **Then** the exported file reflects the per-track volume levels set in the DAW
3. **Given** clips are positioned at specific measures, **When** exported, **Then** the exported file preserves the silence between measure 1 and the start of each clip
4. **Given** the song includes both audio and MIDI clips, **When** exported, **Then** all tracks are rendered into the output file
5. **Given** an export is in progress, **When** it completes, **Then** the user receives a download of the file

---

### Edge Cases

- What happens when a clip is moved to a position before the current playhead during live playback?
- How does the system handle MIDI files with multiple channels or tracks?
- What happens if export is triggered while playback is active?
- How does the system handle existing tracks stored with the old 0–100 volume scale when migrating to dB?
- What happens if a MIDI file's duration exceeds the song length?
- What if a clip's audio file is unavailable during export?
- What if right-clicking a clip during playback — does the context menu appear without interrupting audio?
- What happens when the user right-clicks a MIDI clip — is "Export clip" available or hidden?

## Requirements *(mandatory)*

### Functional Requirements

**Clip Repositioning**

- **FR-001**: The system MUST allow users to drag and reposition audio clips on the timeline while the song is actively playing
- **FR-002**: When a clip is repositioned during playback, the audio engine MUST reflect the new position without requiring a full playback stop/restart
- **FR-003**: The new clip position MUST be persisted to the server after being changed (during or outside playback)

**dB Volume**

- **FR-004**: Track volume MUST be stored and displayed in decibels (dB), replacing the current 0–100 percentage scale
- **FR-005**: The volume slider MUST use a logarithmic scale so that equal slider movements produce equal perceived loudness changes
- **FR-006**: The audio engine MUST apply the dB volume value as the actual gain of the track's audio output
- **FR-007**: Volume adjustments MUST take effect in real time during playback
- **FR-008**: The system MUST define a practical minimum (−60 dB or −∞) that results in silence, and a maximum of +6 dB

**MIDI Import & Preset Playback**

- **FR-009**: Users MUST be able to upload a `.mid` file to a track, resulting in a MIDI clip on the timeline
- **FR-010**: MIDI clips MUST be visually distinguishable from audio clips on the timeline
- **FR-011**: The system MUST play back MIDI clips during song playback using a selected instrument preset
- **FR-012**: Each track with MIDI clips MUST have an instrument preset selector with at least the 128 General MIDI instruments available
- **FR-013**: Changing a track's instrument preset MUST take effect on subsequent playback
- **FR-014**: MIDI clips MUST respect track volume settings

**Individual Clip Export**

- **FR-015**: Right-clicking an audio clip MUST display a context menu with an "Export clip" action
- **FR-016**: Selecting "Export clip" MUST immediately trigger a browser download of that clip's audio file
- **FR-017**: The downloaded file MUST contain only the audio of the selected clip, not mixed with other tracks
- **FR-018**: The downloaded filename MUST be derived from the clip's name
- **FR-019**: The context menu MUST be dismissible without action by clicking outside it
- **FR-020**: Right-clicking a MIDI clip MUST NOT show an "Export clip" option (MIDI export is out of scope)

**Song Export**

- **FR-021**: Users MUST be able to export a song as a mixed-down audio file (WAV format minimum)
- **FR-022**: The export MUST include all tracks (audio and MIDI) rendered at their configured volumes
- **FR-023**: The export MUST preserve the timing and positions of all clips as laid out on the timeline
- **FR-024**: The exported file MUST be delivered to the user as a browser download

### Key Entities

- **AudioClip**: A segment of audio placed at a specific measure on a track; has a file reference, start measure, and name
- **MidiClip**: A segment of MIDI note data placed at a specific measure on a track; has a file reference, start measure, and name
- **Track**: A horizontal lane in the DAW; contains clips, a volume level (dB), an optional instrument preset (for MIDI playback), and a name
- **InstrumentPreset**: A named synthesized instrument sound corresponding to a General MIDI program (0–127)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reposition audio clips during playback without audible interruption (no clicks, gaps, or restarts in the playing audio)
- **SC-002**: A track set to 0 dB sounds louder than the same track at −6 dB; the difference matches the expected psychoacoustic relationship
- **SC-003**: Volume adjustments during playback take effect within 50 ms of the user's interaction
- **SC-004**: A `.mid` file can be imported and begin playing with a preset sound within 3 seconds of the file being selected
- **SC-005**: The full set of 128 General MIDI instrument presets is available for selection on MIDI tracks
- **SC-006**: Right-clicking an audio clip and selecting "Export clip" triggers a download within 1 second
- **SC-007**: The individual clip download contains only the audio of that clip with no other tracks audible
- **SC-008**: An exported song audio file of a 3-minute song is generated and available for download within 30 seconds
- **SC-009**: The exported song file, when played in an external audio player, sounds identical to the in-DAW playback (same timing, same relative volume levels)
- **SC-010**: 100% of tracks with audio or MIDI clips are included in the exported song file

## Assumptions

- The existing BPM and measure-based timeline system remains unchanged; all features build on top of it
- Individual clip export serves the clip's source file directly (no re-encoding or mixing required)
- MIDI clip export is out of scope; "Export clip" only appears on audio clips
- Full song export produces a WAV file; MP3 is a secondary format
- The instrument preset library will play back entirely in the browser with no server-side synthesis
- Volume migration: existing tracks stored with 0–100 values will be converted to dB on first load (100 → 0 dB, 50 → ~−6 dB, 0 → −∞)
- Export produces a stereo WAV file at the browser's default audio sample rate (44.1 kHz or 48 kHz)
- MIDI files with multiple channels are supported; all channels play back on the same track using the track's selected preset
- The feature targets modern browsers with Web Audio API support (Chrome 90+, Firefox 90+, Safari 15+)
