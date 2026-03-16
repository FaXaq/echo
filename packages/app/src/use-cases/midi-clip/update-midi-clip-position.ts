import type { MidiClipRepoPort } from "../../ports/midi-clip";
import { conflict } from "../../errors";

export const makeUpdateMidiClipPosition =
  (deps: { midiClipRepo: MidiClipRepoPort }) =>
  async (input: { clipId: string; startMeasure: number }) => {
    if (input.startMeasure < 1) {
      throw conflict("Start measure must be >= 1");
    }
    return deps.midiClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
    });
  };
