import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function reorderTracks(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string; orderedTrackIds: string[] },
) {
  if (input.orderedTrackIds.length === 0) {
    return;
  }

  const uniqueIds = new Set(input.orderedTrackIds);
  if (uniqueIds.size !== input.orderedTrackIds.length) {
    throw conflict("orderedTrackIds contains duplicate track IDs");
  }

  const existingTracks = await deps.trackRepo.list(deps.db, { songId: input.songId });
  const existingIds = new Set(existingTracks.map((t) => t.id));

  for (const trackId of input.orderedTrackIds) {
    if (!existingIds.has(trackId)) {
      throw notFound(`Track ${trackId}`);
    }
  }

  if (input.orderedTrackIds.length !== existingTracks.length) {
    throw conflict("orderedTrackIds must include all tracks belonging to the song");
  }

  await deps.trackRepo.reorder(deps.db, { orderedTrackIds: input.orderedTrackIds });
}
