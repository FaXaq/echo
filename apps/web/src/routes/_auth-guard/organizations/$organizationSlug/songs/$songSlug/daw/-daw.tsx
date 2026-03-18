import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import { Timeline } from "./-timeline";
import { MultiFileDropModal } from "./-multi-file-drop-modal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";
import type { PendingMultiFileDrop, MultiFileDropMode } from "./-timeline";
import { logger } from "@/lib/logger";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Song = RouterOutput["organization"]["song"]["get"];
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];
type MidiClip = RouterOutput["organization"]["midiClip"]["listBySong"][number];

interface DawProps {
  song: Song;
  initialTracks: Track[];
  initialClips: AudioClip[];
  initialMidiClips: MidiClip[];
  bpm: number;
}

// ============================================================================
// NEW: Undo/Redo types
// ============================================================================

type HistoryEntry = {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  apiUndo: () => void;   // fires inverse mutation (fire-and-forget)
};

// ============================================================================

export function Daw({ song, initialTracks, initialClips, initialMidiClips, bpm }: DawProps) {
  const { t } = useTranslation("songs");
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [clips, setClips] = useState<AudioClip[]>(initialClips);
  const [midiClips, setMidiClips] = useState<MidiClip[]>(initialMidiClips);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  // T009-T013: State for multi-file drop modal
  const [pendingMultiDrop, setPendingMultiDrop] = useState<PendingMultiFileDrop>(null);
  // T026-T027: Track if bottom drop zone is active
  const [bottomDropZone, setBottomDropZone] = useState(false);

  // NEW: Undo/Redo history stacks (capped at 50 entries each)
  // @ts-expect-error - history state values not yet read, but setHistory is used in callbacks
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // @ts-expect-error - future state values not yet read, but setFuture is used in callbacks
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  // Tone.js refs — never stored in state
  const playersRef = useRef<Map<string, { player: Tone.Player; eventId: number }>>(new Map());
  const midiScheduledRef = useRef<Map<string, { synth: Tone.PolySynth; eventIds: number[] }>>(new Map());
  const midiParsedDataRef = useRef<Map<string, Midi>>(new Map()); // storageKey -> parsed Midi
  const volumesRef = useRef<Map<string, Tone.Volume>>(new Map());
  const rafTickRef = useRef<number | null>(null);
  const repeatIdRef = useRef<number | null>(null);

  // Stable ref used by effects to read current midiClips without adding them as a dep
  const midiClipsRef = useRef(midiClips);
  midiClipsRef.current = midiClips;

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // NEW: Undo/Redo helper functions
  const pushHistory = useCallback(
    (apiUndo: () => void) => {
      setHistory((h) => {
        const newHistory = [...h, { tracks, clips, midiClips, apiUndo }];
        // Cap history at 50 entries
        return newHistory.slice(-50);
      });
      // Redo stack is cleared when a new action happens
      setFuture([]);
    },
    [tracks, clips, midiClips],
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const entry = h[h.length - 1];
      // Save current state to future
      setFuture((f) => [...f, { tracks, clips, midiClips, apiUndo: () => {} }]);
      // Restore previous state
      setTracks(entry.tracks);
      setClips(entry.clips);
      setMidiClips(entry.midiClips);
      // Fire the inverse mutation (fire-and-forget)
      entry.apiUndo();
      return h.slice(0, -1);
    });
  }, [tracks, clips, midiClips]);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const entry = f[0];
      // Save current state to history
      setHistory((h) => {
        const newHistory = [...h, { tracks, clips, midiClips, apiUndo: () => {} }];
        return newHistory.slice(-50);
      });
      // Restore future state
      setTracks(entry.tracks);
      setClips(entry.clips);
      setMidiClips(entry.midiClips);
      return f.slice(1);
    });
  }, [tracks, clips, midiClips]);

  // NEW: Attach keyboard listener for Cmd+Z / Ctrl+Z (undo) and Cmd+Shift+Z / Ctrl+Y (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Cmd+Shift+Z (Mac) or Ctrl+Shift+Z / Ctrl+Y (Windows/Linux)
      if (
        ((e.metaKey && e.shiftKey && e.key === "z") ||
          (e.ctrlKey && e.shiftKey && e.key === "z") ||
          (e.ctrlKey && e.key === "y")) &&
        !e.altKey
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const updateVolume = trpc.organization.track.updateVolume.useMutation();
  const createTrack = trpc.organization.track.create.useMutation();
  // T023-T025: Mutation for track reordering
  const reorderTracks = trpc.organization.track.reorder.useMutation();
  // T011-T012: Mutations for multi-file import
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const registerMidiClip = trpc.organization.midiClip.register.useMutation();

  const getDownloadUrlsQuery = trpc.organization.audioClip.getDownloadUrls.useQuery(
    { storageKeys: clips.map((c) => c.file.storageKey) },
    { enabled: clips.length > 0 },
  );

  const getMidiDownloadUrlsQuery = trpc.organization.midiClip.getDownloadUrls.useQuery(
    { storageKeys: midiClips.map((c) => c.file.storageKey) },
    { enabled: midiClips.length > 0 },
  );

  const handleTrackDeleted = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
    setMidiClips((prev) => prev.filter((c) => c.trackId !== trackId));
  }, []);

  const handleVolumeChanged = useCallback(
    (trackId: string, volumeDb: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, volume: volumeDb } : t)),
      );

      // Live volume update during playback
      volumesRef.current.get(trackId)?.volume.rampTo(volumeDb, 0.05);

      const existing = debounceTimers.current.get(trackId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        updateVolume.mutate({ trackId, volumeDb });
        debounceTimers.current.delete(trackId);
      }, 400);

      debounceTimers.current.set(trackId, timer);
    },
    [updateVolume],
  );

  const handleClipUploaded = useCallback((clip: AudioClip) => {
    setClips((prev) => [...prev, clip]);
  }, []);

  const handleMidiClipUploaded = useCallback((clip: MidiClip) => {
    setMidiClips((prev) => [...prev, clip]);
  }, []);

  const handleClipPositionChanged = useCallback(
    (clip: AudioClip) => {
      setClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));

      // Live reposition during playback
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
          // Clip started in the past — play from current offset if still within clip duration
          const offsetIntoClip = transportSeconds - newStartSeconds;
          const clipDurationSeconds = clip.durationMs ? clip.durationMs / 1000 : Infinity;
          if (offsetIntoClip < clipDurationSeconds) {
            entry.player.start(Tone.now(), offsetIntoClip);
          }
          playersRef.current.set(clip.id, { player: entry.player, eventId: -1 });
        }
      }
    },
    [isPlaying, bpm],
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

      // Cancel old events and stop any held notes
      for (const id of entry.eventIds) Tone.getTransport().clear(id);
      entry.synth.releaseAll();

      // Reschedule future notes at new position
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
    [isPlaying, bpm],
  );

  const handleClipDeleted = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  const handleMidiClipDeleted = useCallback((clipId: string) => {
    setMidiClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  const handleTrackRenamed = useCallback((trackId: string, name: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, name } : t)),
    );
  }, []);

  // T023-T025: Handle track reordering
  const handleTracksReordered = useCallback(
    (reorderedTracks: Track[]) => {
      setTracks(reorderedTracks);
      // T025: Fire track.reorder mutation with new ordered track IDs
      const orderedTrackIds = reorderedTracks.map((t) => t.id);
      reorderTracks.mutate(
        {
          songId: song.id,
          orderedTrackIds,
        },
        {
          onError: (error) => {
            logger.error("Failed to reorder tracks:", error instanceof Error ? error.message : String(error));
          },
        },
      );
    },
    [song.id, reorderTracks],
  );

  const handleClipRenamed = useCallback((clipId: string, name: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, name } : c)),
    );
  }, []);

  const downloadUrlsMap = useMemo(
    () =>
      new Map([
        ...(getDownloadUrlsQuery.data ?? []).map((e): [string, string] => [e.key, e.url]),
        ...(getMidiDownloadUrlsQuery.data ?? []).map((e): [string, string] => [e.key, e.url]),
      ]),
    [getDownloadUrlsQuery.data, getMidiDownloadUrlsQuery.data],
  );


  const handleAddTrack = useCallback(() => {
    const name = `Track ${tracks.length + 1}`;
    createTrack.mutate(
      { songId: song.id, name },
      {
        onSuccess: (track) => {
          setTracks((prev) => [...prev, track]);
          setEditingTrackId(track.id);
        },
      },
    );
  }, [createTrack, song.id, tracks.length]);

  // T011: "Use existing tracks" import logic
  const handleImportUseExistingTracks = useCallback(
    async (files: File[], targetTrackIndex: number, targetStartMeasure: number) => {
      if (!pendingMultiDrop) return;

      try {
        // For each file, resolve target track (existing or create new)
        const trackForFile: Record<number, Track> = {};
        let currentTrackIndex = targetTrackIndex;
        let updatedTracks = [...tracks];

        for (let i = 0; i < files.length; i++) {
          if (currentTrackIndex < updatedTracks.length) {
            trackForFile[i] = updatedTracks[currentTrackIndex];
          } else {
            // Create a new track for this file
            const newTrack = await createTrack.mutateAsync({
              songId: song.id,
              name: `Track ${updatedTracks.length + 1}`,
            });
            updatedTracks = [...updatedTracks, newTrack];
            trackForFile[i] = newTrack;
          }
          currentTrackIndex++;
        }

        // Run all uploads in parallel via Promise.allSettled
        const uploadResults = await Promise.allSettled(
          files.map(async (file, idx) => {
            const track = trackForFile[idx];
            const fileType = detectFileTypeFromFile(file);
            if (!fileType) return null;

            let durationMs: number | undefined;
            if (fileType === "audio") {
              durationMs = await getAudioDurationMs(file);
            } else {
              try {
                const midi = new Midi(await file.arrayBuffer());
                if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
              } catch { /* leave undefined */ }
            }

            const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
              filename: file.name,
              contentType: fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
              organizationId: song.organizationId,
            });

            await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
              },
            });

            return { track, file, fileType, storageKey, durationMs };
          }),
        );

        // Register clips sequentially
        const newClips: AudioClip[] = [];
        const newMidiClips: MidiClip[] = [];
        for (const result of uploadResults) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const uploadData = result.value as { track: Track; file: File; fileType: "audio" | "midi"; storageKey: string; durationMs?: number };
          const { track, file, fileType, storageKey, durationMs } = uploadData;

          if (fileType === "audio") {
            const clip = await registerClip.mutateAsync({
              trackId: track.id,
              filename: file.name,
              storageKey,
              organizationId: song.organizationId,
              startMeasure: targetStartMeasure,
              durationMs,
            });
            newClips.push(clip);
          } else {
            const clip = await registerMidiClip.mutateAsync({
              trackId: track.id,
              filename: file.name,
              storageKey,
              organizationId: song.organizationId,
              startMeasure: targetStartMeasure,
              durationMs,
            });
            newMidiClips.push(clip);
          }
        }

        // Update state with new tracks and clips
        setTracks(updatedTracks);
        setClips((prev) => [...prev, ...newClips]);
        setMidiClips((prev) => [...prev, ...newMidiClips]);

        // Push single undo entry
        pushHistory(() => {
          // API undo: delete all created clips and optionally delete created tracks
          // For now, fire-and-forget (empty)
        });

        setPendingMultiDrop(null);
      } catch (err) {
        logger.error("Multi-file import failed", err instanceof Error ? err.message : String(err));
        setPendingMultiDrop(null);
      }
    },
    [pendingMultiDrop, tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory],
  );

  // T012: "Create new tracks" import logic
  const handleImportCreateNewTracks = useCallback(
    async (files: File[], targetStartMeasure: number) => {
      if (!pendingMultiDrop) return;

      try {
        const newTracks: Track[] = [];

        // For each file, call track.create sequentially (preserves auto-increment order)
        for (let i = 0; i < files.length; i++) {
          const newTrack = await createTrack.mutateAsync({
            songId: song.id,
            name: `Track ${(tracks.length + newTracks.length) + 1}`,
          });
          newTracks.push(newTrack);
        }

        // Run all uploads in parallel
        const uploadResults = await Promise.allSettled(
          files.map(async (file, idx) => {
            const track = newTracks[idx];
            const fileType = detectFileTypeFromFile(file);
            if (!fileType) return null;

            let durationMs: number | undefined;
            if (fileType === "audio") {
              durationMs = await getAudioDurationMs(file);
            } else {
              try {
                const midi = new Midi(await file.arrayBuffer());
                if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
              } catch { /* leave undefined */ }
            }

            const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
              filename: file.name,
              contentType: fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
              organizationId: song.organizationId,
            });

            await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
              },
            });

            return { track, file, fileType, storageKey, durationMs };
          }),
        );

        // Register clips sequentially
        const newClips: AudioClip[] = [];
        const newMidiClips: MidiClip[] = [];
        for (const result of uploadResults) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const uploadData = result.value as { track: Track; file: File; fileType: "audio" | "midi"; storageKey: string; durationMs?: number };
          const { track, file, fileType, storageKey, durationMs } = uploadData;

          if (fileType === "audio") {
            const clip = await registerClip.mutateAsync({
              trackId: track.id,
              filename: file.name,
              storageKey,
              organizationId: song.organizationId,
              startMeasure: targetStartMeasure,
              durationMs,
            });
            newClips.push(clip);
          } else {
            const clip = await registerMidiClip.mutateAsync({
              trackId: track.id,
              filename: file.name,
              storageKey,
              organizationId: song.organizationId,
              startMeasure: targetStartMeasure,
              durationMs,
            });
            newMidiClips.push(clip);
          }
        }

        // Update state
        setTracks((prev) => [...prev, ...newTracks]);
        setClips((prev) => [...prev, ...newClips]);
        setMidiClips((prev) => [...prev, ...newMidiClips]);

        // Push undo entry
        pushHistory(() => {
          // API undo: delete all created clips and tracks
          // For now, fire-and-forget
        });

        setPendingMultiDrop(null);
      } catch (err) {
        logger.error("Multi-file import failed", err instanceof Error ? err.message : String(err));
        setPendingMultiDrop(null);
      }
    },
    [pendingMultiDrop, tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory],
  );

  // T027: Handle file drop in bottom zone (create new track)
  const handleBottomZoneDrop = useCallback(
    async (file: File, startMeasure: number) => {
      try {
        const fileType = detectFileTypeFromFile(file);
        if (!fileType) return;

        // Create new track with auto-incremented name
        const newTrackIndex = tracks.length;
        const newTrack = await createTrack.mutateAsync({
          songId: song.id,
          name: `Track ${newTrackIndex + 1}`,
        });

        setTracks((prev) => [...prev, newTrack]);

        // Parse duration
        let durationMs: number | undefined;
        if (fileType === "audio") {
          durationMs = await getAudioDurationMs(file);
        } else {
          try {
            const midi = new Midi(await file.arrayBuffer());
            if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
          } catch { /* leave undefined */ }
        }

        // Get upload URL
        const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
          filename: file.name,
          contentType: fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
          organizationId: song.organizationId,
        });

        // Upload file
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": fileType === "audio" ? (file.type || "audio/mpeg") : "audio/midi",
          },
        });

        // Register clip
        if (fileType === "audio") {
          const clip = await registerClip.mutateAsync({
            trackId: newTrack.id,
            filename: file.name,
            storageKey,
            organizationId: song.organizationId,
            startMeasure,
            durationMs,
          });
          setClips((prev) => [...prev, clip]);
        } else {
          const clip = await registerMidiClip.mutateAsync({
            trackId: newTrack.id,
            filename: file.name,
            storageKey,
            organizationId: song.organizationId,
            startMeasure,
            durationMs,
          });
          setMidiClips((prev) => [...prev, clip]);
        }

        // Push undo entry
        pushHistory(() => {
          // API undo would delete the track and clips
          // For now, fire-and-forget
        });
      } catch (err) {
        logger.error("Bottom zone drop failed", err instanceof Error ? err.message : String(err));
      }
    },
    [tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory],
  );

  // Helper functions for file type and duration detection
  function detectFileTypeFromFile(file: File): "audio" | "midi" | null {
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    if (mime === "audio/midi" || mime === "audio/x-midi" || name.endsWith(".mid") || name.endsWith(".midi"))
      return "midi";
    if (mime.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/.test(name))
      return "audio";
    return null;
  }

  function getAudioDurationMs(file: File): Promise<number | undefined> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(
          Number.isFinite(audio.duration)
            ? Math.round(audio.duration * 1000)
            : undefined,
        );
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      audio.src = url;
    });
  }

  const buildAudioGraph = useCallback(
    async (
      clipsToSchedule: AudioClip[],
      midiClipsToSchedule: MidiClip[],
      tracksToUse: Track[],
      urlMap: Map<string, string>,
      midiUrlMap: Map<string, string>,
    ) => {
      const secondsPerMeasure = (4 * 60) / bpm;

      // Create one Volume node per track
      for (const track of tracksToUse) {
        const vol = new Tone.Volume(track.volume);
        vol.toDestination();
        volumesRef.current.set(track.id, vol);
      }

      // Schedule audio clips
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

      // Schedule MIDI clips using Tone.js PolySynth
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

            // One PolySynth per MIDI clip, connected through the track volume node
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
    },
    [bpm],
  );

  // Schedule newly dropped clips/midi-clips during live playback
  useEffect(() => {
    if (!isPlaying) return;
    const secondsPerMeasure = (4 * 60) / bpm;

    for (const clip of clips) {
      if (playersRef.current.has(clip.id)) continue;
      const url = downloadUrlsMap.get(clip.file.storageKey);
      if (!url) continue;

      const startSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
      const player = new Tone.Player(url);
      // Optimistically reserve the slot so concurrent effect runs don't double-schedule
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
      }).catch(() => {
        playersRef.current.delete(clip.id);
      });
    }
  }, [isPlaying, clips, downloadUrlsMap, bpm]);

  // Stable key that changes only when a clip is added/removed, not when positions change during drag
  const midiClipKey = midiClips.map((c) => c.id).join(",");

  useEffect(() => {
    if (!isPlaying) return;
    const secondsPerMeasure = (4 * 60) / bpm;
    const currentMidiClips = midiClipsRef.current;

    for (const clip of currentMidiClips) {
      if (midiScheduledRef.current.has(clip.id)) continue;
      const url = downloadUrlsMap.get(clip.file.storageKey);
      if (!url) continue;

      // Optimistically reserve so concurrent effect runs don't double-schedule
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, midiClipKey, downloadUrlsMap, bpm]);

  const handlePlay = async () => {
    if (isPlaying) return;

    await Tone.start();

    const urlMap = new Map(
      (getDownloadUrlsQuery.data ?? []).map((e) => [e.key, e.url]),
    );
    const midiUrlMap = new Map(
      (getMidiDownloadUrlsQuery.data ?? []).map((e) => [e.key, e.url]),
    );

    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().seconds = 0;

    await buildAudioGraph(clips, midiClips, tracks, urlMap, midiUrlMap);

    const secondsPerMeasure = (4 * 60) / bpm;

    // Track playback position via RAF
    const tick = () => {
      setPlaybackPosition(Tone.getTransport().seconds / secondsPerMeasure);
      rafTickRef.current = requestAnimationFrame(tick);
    };
    rafTickRef.current = requestAnimationFrame(tick);

    Tone.getTransport().start();
    setIsPlaying(true);
  };

  const handleStop = () => {
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
    midiScheduledRef.current.forEach(({ synth }) => { try { synth.dispose(); } catch { /* ignore */ } });
    midiScheduledRef.current.clear();

    volumesRef.current.forEach((vol) => {
      try { vol.dispose(); } catch { /* ignore */ }
    });
    volumesRef.current.clear();

    setPlaybackPosition(0);
    setIsPlaying(false);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const urlMap = new Map(
        (getDownloadUrlsQuery.data ?? []).map((e) => [e.key, e.url]),
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

        // Rebuild the same audio graph inside the offline context
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

      // Convert to WAV
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

      // Clean up offline volumes
      volumesRef.current.forEach((vol) => { try { vol.dispose(); } catch { /* ignore */ } });
      volumesRef.current.clear();
    } catch (err) {
      logger.error(err, "Export failed:");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <Trans t={t}>Tracks</Trans>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={clips.length === 0 && midiClips.length === 0}
          >
            {isPlaying ? t("Stop") : t("Play")}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || (clips.length === 0 && midiClips.length === 0)}
          >
            {isExporting ? t("Exporting…") : t("Export song")}
          </Button>
        </div>
      </div>

      {/* T013: Render multi-file drop modal */}
      <MultiFileDropModal
        pendingDrop={pendingMultiDrop}
        onConfirm={(mode: MultiFileDropMode) => {
          if (!pendingMultiDrop) return;
          if (mode === "use-existing-tracks") {
            handleImportUseExistingTracks(
              pendingMultiDrop.files,
              pendingMultiDrop.targetTrackIndex,
              pendingMultiDrop.targetStartMeasure,
            );
          } else {
            handleImportCreateNewTracks(
              pendingMultiDrop.files,
              pendingMultiDrop.targetStartMeasure,
            );
          }
        }}
        onCancel={() => setPendingMultiDrop(null)}
      />

      <Timeline
        tracks={tracks}
        clips={clips}
        midiClips={midiClips}
        bpm={bpm}
        playbackPosition={playbackPosition}
        isPlaying={isPlaying}
        organizationId={song.organizationId}
        editingTrackId={editingTrackId}
        downloadUrls={downloadUrlsMap}
        onClipPositionChanged={handleClipPositionChanged}
        onMidiClipPositionChanged={handleMidiClipPositionChanged}
        onVolumeChanged={handleVolumeChanged}
        onTrackDeleted={handleTrackDeleted}
        onClipUploaded={handleClipUploaded}
        onMidiClipUploaded={handleMidiClipUploaded}
        onClipDeleted={handleClipDeleted}
        onMidiClipDeleted={handleMidiClipDeleted}
        onClipRenamed={handleClipRenamed}
        onEditingTrackIdChange={setEditingTrackId}
        onTrackRenamed={handleTrackRenamed}
        onAddTrack={handleAddTrack}
        onTracksReordered={handleTracksReordered}
        // NEW: Undo/redo callbacks
        pushHistory={pushHistory}
        undo={handleUndo}
        redo={handleRedo}
        // T009-T013: Multi-file drop callback
        onPendingMultiDrop={setPendingMultiDrop}
        // T026-T027: Bottom drop zone callbacks
        onBottomDropZoneChange={setBottomDropZone}
        onBottomZoneDrop={handleBottomZoneDrop}
      />
    </div>
  );
}
