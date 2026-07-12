import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";
import { randomUUID } from "node:crypto";

export const makeRegisterMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort; fileRepo: FileRepoPort }) =>
  async (input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  }) => {
    const fileId = randomUUID();
    await deps.fileRepo.create({
      id: fileId,
      storageKey: input.storageKey,
      filename: input.filename,
      type: "midi",
      organizationId: input.organizationId,
    });

    return deps.midiClipRepo.create({
      id: randomUUID(),
      trackId: input.trackId,
      fileId,
      startMeasure: input.startMeasure,
      durationMs: input.durationMs ?? null,
    });
  };

export const makeListMidiClipsBySong =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.midiClipRepo.listBySong({ songId: input.songId });
  };

export const makeUpdateMidiClipPosition =
  (deps: { midiClipRepo: MidiClipRepoPort; trackRepo: TrackRepoPort; db: KyselyDB }) =>
  async (input: { clipId: string; startMeasure: number; trackId?: string }) => {
    if (input.startMeasure < 1) {
      throw conflict("Start measure must be >= 1");
    }

    if (input.trackId !== undefined) {
      const clip = await deps.midiClipRepo.findById({ clipId: input.clipId });
      if (!clip) {
        throw notFound("MidiClip");
      }

      const currentTrack = await deps.trackRepo.findById(deps.db, {
        trackId: clip.trackId,
      });
      if (!currentTrack) {
        throw notFound("Track");
      }

      const targetTrack = await deps.trackRepo.findById(deps.db, {
        trackId: input.trackId,
      });
      if (!targetTrack) {
        throw notFound("Track");
      }

      if (currentTrack.songId !== targetTrack.songId) {
        throw conflict("Target track does not belong to the same song");
      }
    }

    return deps.midiClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
      trackId: input.trackId,
    });
  };

export const makeRenameMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipId: string; name: string }) => {
    if (!input.name.trim()) {
      throw conflict("Clip name cannot be empty");
    }
    return deps.midiClipRepo.rename({
      clipId: input.clipId,
      name: input.name.trim(),
    });
  };

export const makeDeleteMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipId: string }) => {
    return deps.midiClipRepo.delete({ clipId: input.clipId });
  };

export const makeDeleteManyMidiClips =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipIds: string[] }) => {
    if (input.clipIds.length === 0) return;
    await deps.midiClipRepo.deleteMany({ clipIds: input.clipIds });
  };
