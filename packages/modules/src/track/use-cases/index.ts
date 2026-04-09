import type { TrackRepoPort } from "../infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export const makeListTracks =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.trackRepo.list({ songId: input.songId });
  };

export const makeCreateTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { songId: string; name: string; volume?: number }) => {
    const existing = await deps.trackRepo.list({ songId: input.songId });
    const order = existing.length + 1;
    const volume = input.volume ?? 0;
    return deps.trackRepo.create({
      id: crypto.randomUUID(),
      songId: input.songId,
      name: input.name,
      volume,
      order,
    });
  };

export const makeUpdateTrackVolume =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; volumeDb: number }) => {
    if (input.volumeDb < -60 || input.volumeDb > 6) {
      throw conflict("Volume must be between -60 dB and +6 dB");
    }
    return deps.trackRepo.updateVolume({
      trackId: input.trackId,
      volumeDb: input.volumeDb,
    });
  };

export const makeDeleteTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string }) => {
    return deps.trackRepo.delete({ trackId: input.trackId });
  };

export const makeRenameTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; name: string }) => {
    return deps.trackRepo.rename(input);
  };

export const makeSetTrackInstrumentPreset =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; preset: number | null }) => {
    if (
      input.preset !== null &&
      (input.preset < 0 || input.preset > 127 || !Number.isInteger(input.preset))
    ) {
      throw conflict("Instrument preset must be an integer between 0 and 127");
    }
    return deps.trackRepo.setInstrumentPreset({
      trackId: input.trackId,
      preset: input.preset,
    });
  };

export const makeReorderTracks =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { songId: string; orderedTrackIds: string[] }) => {
    if (input.orderedTrackIds.length === 0) {
      return;
    }

    const uniqueIds = new Set(input.orderedTrackIds);
    if (uniqueIds.size !== input.orderedTrackIds.length) {
      throw conflict("orderedTrackIds contains duplicate track IDs");
    }

    const existingTracks = await deps.trackRepo.list({ songId: input.songId });
    const existingIds = new Set(existingTracks.map((t) => t.id));

    for (const trackId of input.orderedTrackIds) {
      if (!existingIds.has(trackId)) {
        throw notFound(`Track ${trackId}`);
      }
    }

    if (input.orderedTrackIds.length !== existingTracks.length) {
      throw conflict(
        "orderedTrackIds must include all tracks belonging to the song",
      );
    }

    await deps.trackRepo.reorder({ orderedTrackIds: input.orderedTrackIds });
  };
