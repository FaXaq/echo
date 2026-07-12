import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import type { TrackRepoPort } from "../../track/infrastructure/index.js";
import { notFound, conflict } from "@echo/errors";

export async function updateMidiClipPosition(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort; trackRepo: TrackRepoPort },
  input: { clipId: string; startMeasure: number; trackId?: string },
) {
  if (input.startMeasure < 1) {
    throw conflict("Start measure must be >= 1");
  }

  if (input.trackId !== undefined) {
    const clip = await deps.midiClipRepo.findById(deps.db, { clipId: input.clipId });
    if (!clip) {
      throw notFound("MidiClip");
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

  return deps.midiClipRepo.updatePosition(deps.db, {
    clipId: input.clipId,
    startMeasure: input.startMeasure,
    trackId: input.trackId,
  });
}
