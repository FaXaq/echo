import type { MidiClipRepoPort } from "../../ports/midi-clip";

export const makeListMidiClipsBySong =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.midiClipRepo.listBySong({ songId: input.songId });
  };
