import type React from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import type { Track, AudioClip, MidiClip } from "./-daw-types";

export async function buildAudioGraph({
  bpm,
  clipsToSchedule,
  midiClipsToSchedule,
  tracksToUse,
  urlMap,
  midiUrlMap,
  volumesRef,
  playersRef,
  midiScheduledRef,
  midiParsedDataRef,
}: {
  bpm: number;
  clipsToSchedule: AudioClip[];
  midiClipsToSchedule: MidiClip[];
  tracksToUse: Track[];
  urlMap: Map<string, string>;
  midiUrlMap: Map<string, string>;
  volumesRef: React.MutableRefObject<Map<string, Tone.Volume>>;
  playersRef: React.MutableRefObject<Map<string, { player: Tone.Player; eventId: number }>>;
  midiScheduledRef: React.MutableRefObject<Map<string, { synth: Tone.PolySynth; eventIds: number[] }>>;
  midiParsedDataRef: React.MutableRefObject<Map<string, Midi>>;
}): Promise<void> {
  const secondsPerMeasure = (4 * 60) / bpm;

  for (const track of tracksToUse) {
    const vol = new Tone.Volume(track.volume);
    vol.toDestination();
    volumesRef.current.set(track.id, vol);
  }

  await Promise.all(
    clipsToSchedule.map(async (clip) => {
      const url = urlMap.get(clip.file.storageKey);
      if (!url) return;
      try {
        const player = new Tone.Player(url);
        await player.load(url);
        const vol = volumesRef.current.get(clip.trackId);
        if (vol) player.connect(vol);
        const startSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
        const eventId = Tone.getTransport().schedule(
          (time) => player.start(time),
          startSeconds,
        );
        playersRef.current.set(clip.id, { player, eventId });
      } catch {
        // skip clips that fail to load
      }
    }),
  );

  await Promise.all(
    midiClipsToSchedule.map(async (clip) => {
      const url = midiUrlMap.get(clip.file.storageKey);
      if (!url) return;
      try {
        const resp = await fetch(url);
        const buf = await resp.arrayBuffer();
        const midi = new Midi(buf);
        midiParsedDataRef.current.set(clip.file.storageKey, midi);

        const vol = volumesRef.current.get(clip.trackId);
        const clipOffsetSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "triangle" },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
        });
        if (vol) synth.connect(vol); else synth.toDestination();

        const eventIds: number[] = [];
        for (const midiTrack of midi.tracks) {
          for (const note of midiTrack.notes) {
            const noteStartSeconds = clipOffsetSeconds + note.time;
            const eventId = Tone.getTransport().schedule((time) => {
              synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
            }, noteStartSeconds);
            eventIds.push(eventId);
          }
        }
        midiScheduledRef.current.set(clip.id, { synth, eventIds });
      } catch {
        // skip MIDI clips that fail to parse
      }
    }),
  );
}
