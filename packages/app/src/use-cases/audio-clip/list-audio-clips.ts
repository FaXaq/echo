import type { AudioClipRepoPort } from "../../ports/audio-clip";

export const makeListAudioClips =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.audioClipRepo.listBySong({ songId: input.songId });
  };
