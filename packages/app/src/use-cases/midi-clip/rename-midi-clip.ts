import type { MidiClipRepoPort } from "../../ports/midi-clip";
import { conflict } from "../../errors";

export const makeRenameMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipId: string; name: string }) => {
    if (!input.name.trim()) {
      throw conflict("Clip name cannot be empty");
    }
    return deps.midiClipRepo.rename({
      clipId: input.clipId,
      name: input.name.trim(),
    });
  };
