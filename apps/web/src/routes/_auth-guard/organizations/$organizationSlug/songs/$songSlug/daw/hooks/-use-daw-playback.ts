import { useRef, useCallback, useEffect } from "react";
import type React from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { logger } from "@/lib/logger";
import type { Song, Track, AudioClip, MidiClip } from "../-daw-types";
import { buildAudioGraph } from "../-daw-audio-graph";

interface UseDawPlaybackDeps {
  song: Song;
  bpm: number;
  clips: AudioClip[];
  midiClips: MidiClip[];
  tracks: Track[];
  downloadUrlsMap: Map<string, string>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackPosition: React.Dispatch<React.SetStateAction<number>>;
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  setMidiClips: React.Dispatch<React.SetStateAction<MidiClip[]>>;
  getDownloadUrlsQueryData: Array<{ key: string; url: string }> | undefined;
  getMidiDownloadUrlsQueryData: Array<{ key: string; url: string }> | undefined;
}

export function useDawPlayback({
  song,
  bpm,
  clips,
  midiClips,
  tracks,
  downloadUrlsMap,
  isPlaying,
  setIsPlaying,
  setIsExporting,
  setPlaybackPosition,
  setClips,
  setMidiClips,
  getDownloadUrlsQueryData,
  getMidiDownloadUrlsQueryData,
}: UseDawPlaybackDeps) {
  const playersRef = useRef<Map<string, { player: Tone.Player; eventId: number }>>(new Map());
  const midiScheduledRef = useRef<Map<string, { synth: Tone.PolySynth; eventIds: number[] }>>(new Map());
  const midiParsedDataRef = useRef<Map<string, Midi>>(new Map());
  const volumesRef = useRef<Map<string, Tone.Volume>>(new Map());
  const rafTickRef = useRef<number | null>(null);
  const repeatIdRef = useRef<number | null>(null);

  // Stable ref to read midiClips without adding as dep in effects
  const midiClipsRef = useRef(midiClips);
  midiClipsRef.current = midiClips;


  // Live-schedule newly uploaded audio clips during playback
  const clipKey = clips.map((c) => c.id).join(",");
  useEffect(() => {
    if (!isPlaying) return;
    const secondsPerMeasure = (4 * 60) / bpm;

    for (const clip of clips) {
      if (playersRef.current.has(clip.id)) continue;
      const url = downloadUrlsMap.get(clip.file.storageKey);
      if (!url) continue;

      const startSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
      const player = new Tone.Player(url);
      playersRef.current.set(clip.id, { player, eventId: -1 });

      player.load(url).then(() => {
        const vol = volumesRef.current.get(clip.trackId);
        if (vol) player.connect(vol);

        const transportSeconds = Tone.getTransport().seconds;
        if (startSeconds > transportSeconds) {
          const eventId = Tone.getTransport().schedule(
            (time) => player.start(time),
            startSeconds,
          );
          playersRef.current.set(clip.id, { player, eventId });
        } else {
          const offsetIntoClip = transportSeconds - startSeconds;
          const clipDurationSeconds = clip.durationMs ? clip.durationMs / 1000 : Infinity;
          if (offsetIntoClip < clipDurationSeconds) {
            player.start(Tone.now(), offsetIntoClip);
          }
          playersRef.current.set(clip.id, { player, eventId: -1 });
        }
      });
    }
  }, [isPlaying, clipKey, downloadUrlsMap, bpm]);

  // Live-schedule newly uploaded MIDI clips during playback
  const midiClipKey = midiClips.map((c) => c.id).join(",");
  useEffect(() => {
    if (!isPlaying) return;
    const secondsPerMeasure = (4 * 60) / bpm;
    const currentMidiClips = midiClipsRef.current;

    for (const clip of currentMidiClips) {
      if (midiScheduledRef.current.has(clip.id)) continue;
      const url = downloadUrlsMap.get(clip.file.storageKey);
      if (!url) continue;

      midiScheduledRef.current.set(clip.id, { synth: new Tone.PolySynth(), eventIds: [] });
      const clipOffsetSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
      const transportSeconds = Tone.getTransport().seconds;

      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          const midi = new Midi(buf);
          midiParsedDataRef.current.set(clip.file.storageKey, midi);

          const vol = volumesRef.current.get(clip.trackId);
          const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
          });
          if (vol) synth.connect(vol); else synth.toDestination();

          const eventIds: number[] = [];
          for (const midiTrack of midi.tracks) {
            for (const note of midiTrack.notes) {
              const noteAbsoluteSeconds = clipOffsetSeconds + note.time;
              if (noteAbsoluteSeconds <= transportSeconds) continue;
              const eventId = Tone.getTransport().schedule((time) => {
                synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
              }, noteAbsoluteSeconds);
              eventIds.push(eventId);
            }
          }
          midiScheduledRef.current.set(clip.id, { synth, eventIds });
        })
        .catch(() => {
          midiScheduledRef.current.delete(clip.id);
        });
    }

  }, [isPlaying, midiClipKey, downloadUrlsMap, bpm]);

  const handleClipPositionChanged = useCallback(
    (clip: AudioClip) => {
      setClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));

      const entry = playersRef.current.get(clip.id);
      if (entry && isPlaying) {
        const secondsPerMeasure = (4 * 60) / bpm;
        const newStartSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
        Tone.getTransport().clear(entry.eventId);
        entry.player.stop();

        const transportSeconds = Tone.getTransport().seconds;
        if (newStartSeconds > transportSeconds) {
          const newEventId = Tone.getTransport().schedule(
            (time) => entry.player.start(time),
            newStartSeconds,
          );
          playersRef.current.set(clip.id, { player: entry.player, eventId: newEventId });
        } else {
          const offsetIntoClip = transportSeconds - newStartSeconds;
          const clipDurationSeconds = clip.durationMs ? clip.durationMs / 1000 : Infinity;
          if (offsetIntoClip < clipDurationSeconds) {
            entry.player.start(Tone.now(), offsetIntoClip);
          }
          playersRef.current.set(clip.id, { player: entry.player, eventId: -1 });
        }
      }
    },
    [isPlaying, bpm, setClips],
  );

  const handleMidiClipPositionChanged = useCallback(
    (clip: MidiClip) => {
      setMidiClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));

      const entry = midiScheduledRef.current.get(clip.id);
      if (!entry || !isPlaying) return;

      const midi = midiParsedDataRef.current.get(clip.file.storageKey);
      if (!midi) return;

      const secondsPerMeasure = (4 * 60) / bpm;
      const newClipOffsetSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
      const transportSeconds = Tone.getTransport().seconds;

      for (const id of entry.eventIds) Tone.getTransport().clear(id);
      entry.synth.releaseAll();

      const newEventIds: number[] = [];
      for (const midiTrack of midi.tracks) {
        for (const note of midiTrack.notes) {
          const noteAbsoluteSeconds = newClipOffsetSeconds + note.time;
          if (noteAbsoluteSeconds <= transportSeconds) continue;
          const eventId = Tone.getTransport().schedule((time) => {
            entry.synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
          }, noteAbsoluteSeconds);
          newEventIds.push(eventId);
        }
      }
      midiScheduledRef.current.set(clip.id, { synth: entry.synth, eventIds: newEventIds });
    },
    [isPlaying, bpm, setMidiClips],
  );

  const handlePlay = useCallback(async () => {
    if (isPlaying) return;

    await Tone.start();

    const urlMap = new Map(
      (getDownloadUrlsQueryData ?? []).map((e) => [e.key, e.url]),
    );
    const midiUrlMap = new Map(
      (getMidiDownloadUrlsQueryData ?? []).map((e) => [e.key, e.url]),
    );

    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().seconds = 0;

    await buildAudioGraph({
      bpm,
      clipsToSchedule: clips,
      midiClipsToSchedule: midiClips,
      tracksToUse: tracks,
      urlMap,
      midiUrlMap,
      volumesRef,
      playersRef,
      midiScheduledRef,
      midiParsedDataRef,
    });

    const secondsPerMeasure = (4 * 60) / bpm;
    const tick = () => {
      setPlaybackPosition(Tone.getTransport().seconds / secondsPerMeasure);
      rafTickRef.current = requestAnimationFrame(tick);
    };
    rafTickRef.current = requestAnimationFrame(tick);

    Tone.getTransport().start();
    setIsPlaying(true);
  }, [
    isPlaying,
    bpm,
    clips,
    midiClips,
    tracks,
    setIsPlaying,
    setPlaybackPosition,
    getDownloadUrlsQueryData,
    getMidiDownloadUrlsQueryData,
  ]);

  const handleStop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    if (rafTickRef.current !== null) {
      cancelAnimationFrame(rafTickRef.current);
      rafTickRef.current = null;
    }
    if (repeatIdRef.current !== null) {
      Tone.getTransport().clear(repeatIdRef.current);
      repeatIdRef.current = null;
    }

    playersRef.current.forEach(({ player }) => {
      try { player.dispose(); } catch { /* ignore */ }
    });
    playersRef.current.clear();

    midiScheduledRef.current.forEach(({ synth }) => {
      try { synth.dispose(); } catch { /* ignore */ }
    });
    midiScheduledRef.current.clear();

    volumesRef.current.forEach((vol) => {
      try { vol.dispose(); } catch { /* ignore */ }
    });
    volumesRef.current.clear();

    setPlaybackPosition(0);
    setIsPlaying(false);
  }, [setIsPlaying, setPlaybackPosition]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const urlMap = new Map(
        (getDownloadUrlsQueryData ?? []).map((e) => [e.key, e.url]),
      );
      const secondsPerMeasure = (4 * 60) / bpm;
      const lastClipEnd = clips.reduce((max, clip) => {
        const durationMeasures = clip.durationMs
          ? clip.durationMs / 1000 / secondsPerMeasure
          : 1;
        return Math.max(max, clip.startMeasure - 1 + durationMeasures);
      }, 0);
      const totalDurationSeconds = Math.max(lastClipEnd * secondsPerMeasure, 1);

      const buffer = await Tone.Offline(async () => {
        Tone.getTransport().bpm.value = bpm;

        for (const track of tracks) {
          const vol = new Tone.Volume(track.volume);
          vol.toDestination();
          volumesRef.current.set(track.id, vol);
        }

        await Promise.all(
          clips.map(async (clip) => {
            const url = urlMap.get(clip.file.storageKey);
            if (!url) return;
            try {
              const player = new Tone.Player(url);
              await player.load(url);
              const vol = volumesRef.current.get(clip.trackId);
              if (vol) player.connect(vol);
              const startSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
              Tone.getTransport().schedule((time) => player.start(time), startSeconds);
            } catch {
              // skip
            }
          }),
        );

        Tone.getTransport().start();
      }, totalDurationSeconds);

      const { default: toWav } = await import("audiobuffer-to-wav");
      const wav = toWav(buffer.get()!);
      const blob = new Blob([wav], { type: "audio/wav" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${song.name}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      volumesRef.current.forEach((vol) => { try { vol.dispose(); } catch { /* ignore */ } });
      volumesRef.current.clear();
    } catch (err) {
      logger.error(err, "Export failed:");
    } finally {
      setIsExporting(false);
    }
  }, [bpm, clips, tracks, song.name, setIsExporting, getDownloadUrlsQueryData]);

  return {
    volumesRef,
    playersRef,
    midiScheduledRef,
    midiParsedDataRef,
    handlePlay,
    handleStop,
    handleExport,
    handleClipPositionChanged,
    handleMidiClipPositionChanged,
  };
}
