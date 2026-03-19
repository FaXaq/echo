import { useCallback } from "react";
import type React from "react";
import { Midi } from "@tonejs/midi";
import { trpc } from "@/lib/trpc";
import { logger } from "@/lib/logger";
import { detectFileTypeFromFile, getAudioDurationMs } from "../-file-utils";
import type { Song, Track, AudioClip, MidiClip, PendingMultiFileDrop } from "../-daw-types";

interface UseDawFileImportDeps {
  song: Song;
  tracks: Track[];
  pendingMultiDrop: PendingMultiFileDrop;
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  setMidiClips: React.Dispatch<React.SetStateAction<MidiClip[]>>;
  setPendingMultiDrop: React.Dispatch<React.SetStateAction<PendingMultiFileDrop>>;
  pushHistory: (apiUndo: () => void) => void;
}

export function useDawFileImport({
  song,
  tracks,
  pendingMultiDrop,
  setTracks,
  setClips,
  setMidiClips,
  setPendingMultiDrop,
  pushHistory,
}: UseDawFileImportDeps) {
  const createTrack = trpc.organization.track.create.useMutation();
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const registerMidiClip = trpc.organization.midiClip.register.useMutation();

  const handleImportUseExistingTracks = useCallback(
    async (files: File[], targetTrackIndex: number, targetStartMeasure: number) => {
      if (!pendingMultiDrop) return;

      try {
        const trackForFile: Record<number, Track> = {};
        let currentTrackIndex = targetTrackIndex;
        let updatedTracks = [...tracks];

        for (let i = 0; i < files.length; i++) {
          if (currentTrackIndex < updatedTracks.length) {
            trackForFile[i] = updatedTracks[currentTrackIndex];
          } else {
            const newTrack = await createTrack.mutateAsync({
              songId: song.id,
              name: `Track ${updatedTracks.length + 1}`,
            });
            updatedTracks = [...updatedTracks, newTrack];
            trackForFile[i] = newTrack;
          }
          currentTrackIndex++;
        }

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

        const newClips: AudioClip[] = [];
        const newMidiClips: MidiClip[] = [];
        for (const result of uploadResults) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const { track, file, fileType, storageKey, durationMs } = result.value as {
            track: Track; file: File; fileType: "audio" | "midi"; storageKey: string; durationMs?: number;
          };

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

        setTracks(updatedTracks);
        setClips((prev) => [...prev, ...newClips]);
        setMidiClips((prev) => [...prev, ...newMidiClips]);
        pushHistory(() => { });
        setPendingMultiDrop(null);
      } catch (err) {
        logger.error("Multi-file import failed", err instanceof Error ? err.message : String(err));
        setPendingMultiDrop(null);
      }
    },
    [pendingMultiDrop, tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory, setTracks, setClips, setMidiClips, setPendingMultiDrop],
  );

  const handleImportCreateNewTracks = useCallback(
    async (files: File[], targetStartMeasure: number) => {
      if (!pendingMultiDrop) return;

      try {
        const newTracks: Track[] = [];

        for (let i = 0; i < files.length; i++) {
          const newTrack = await createTrack.mutateAsync({
            songId: song.id,
            name: `Track ${tracks.length + newTracks.length + 1}`,
          });
          newTracks.push(newTrack);
        }

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

        const newClips: AudioClip[] = [];
        const newMidiClips: MidiClip[] = [];
        for (const result of uploadResults) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const { track, file, fileType, storageKey, durationMs } = result.value as {
            track: Track; file: File; fileType: "audio" | "midi"; storageKey: string; durationMs?: number;
          };

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

        setTracks((prev) => [...prev, ...newTracks]);
        setClips((prev) => [...prev, ...newClips]);
        setMidiClips((prev) => [...prev, ...newMidiClips]);
        pushHistory(() => { });
        setPendingMultiDrop(null);
      } catch (err) {
        logger.error("Multi-file import failed", err instanceof Error ? err.message : String(err));
        setPendingMultiDrop(null);
      }
    },
    [pendingMultiDrop, tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory, setTracks, setClips, setMidiClips, setPendingMultiDrop],
  );

  const handleBottomZoneDrop = useCallback(
    async (file: File, startMeasure: number) => {
      try {
        const fileType = detectFileTypeFromFile(file);
        if (!fileType) return;

        const newTrack = await createTrack.mutateAsync({
          songId: song.id,
          name: `Track ${tracks.length + 1}`,
        });
        setTracks((prev) => [...prev, newTrack]);

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

        pushHistory(() => { });
      } catch (err) {
        logger.error("Bottom zone drop failed", err instanceof Error ? err.message : String(err));
      }
    },
    [tracks, song, createTrack, getUploadUrl, registerClip, registerMidiClip, pushHistory, setTracks, setClips, setMidiClips],
  );

  return { handleImportUseExistingTracks, handleImportCreateNewTracks, handleBottomZoneDrop };
}
