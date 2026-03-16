import type { MidiClipRepoPort } from "../../ports/midi-clip";

export const makeDeleteMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipId: string }) => {
    return deps.midiClipRepo.delete({ clipId: input.clipId });
  };
