import type { TrackRepoPort } from "../../ports/track";

export const makeRenameTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; name: string }) => {
    return deps.trackRepo.rename(input);
  };
