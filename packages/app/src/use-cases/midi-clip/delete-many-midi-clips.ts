import type { MidiClipRepoPort } from "../../ports/midi-clip";

export const makeDeleteManyMidiClips =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipIds: string[] }) => {
    if (input.clipIds.length === 0) return;
    await deps.midiClipRepo.deleteMany({ clipIds: input.clipIds });
  };
