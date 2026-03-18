import type { TrackRepoPort } from "../../ports/track";
import { notFound, conflict } from "../../errors";

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
