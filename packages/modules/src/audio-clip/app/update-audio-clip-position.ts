import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function updateAudioClipPosition(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; trackRepo: TrackRepoPort },
  input: { clipId: string; startMeasure: number; trackId?: string },
) {
  if (input.trackId !== undefined) {
    const clip = await deps.audioClipRepo.findById(deps.db, { clipId: input.clipId });
    if (!clip) {
      throw notFound("AudioClip");
    }

    const currentTrack = await deps.trackRepo.findById(deps.db, { trackId: clip.trackId });
    if (!currentTrack) {
      throw notFound("Track");
    }

    const targetTrack = await deps.trackRepo.findById(deps.db, { trackId: input.trackId });
    if (!targetTrack) {
      throw notFound("Track");
    }

    if (currentTrack.songId !== targetTrack.songId) {
      throw conflict("Target track does not belong to the same song");
    }
  }

  return deps.audioClipRepo.updatePosition(deps.db, {
    clipId: input.clipId,
    startMeasure: input.startMeasure,
    trackId: input.trackId,
  });
}
