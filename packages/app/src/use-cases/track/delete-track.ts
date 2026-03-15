import type { TrackRepoPort } from "../../ports/track";

export const makeDeleteTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string }) => {
    return deps.trackRepo.delete({ trackId: input.trackId });
  };
