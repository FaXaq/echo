import type { MidiClipRepoPort } from "../../ports/midi-clip";
import type { FileRepoPort } from "../../ports/file";
import { randomUUID } from "node:crypto";

export const makeRegisterMidiClip =
  (deps: { midiClipRepo: MidiClipRepoPort; fileRepo: FileRepoPort }) =>
  async (input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  }) => {
    const fileId = randomUUID();
    await deps.fileRepo.create({
      id: fileId,
      storageKey: input.storageKey,
      filename: input.filename,
      type: "midi",
      organizationId: input.organizationId,
    });

    return deps.midiClipRepo.create({
      id: randomUUID(),
      trackId: input.trackId,
      fileId,
      startMeasure: input.startMeasure,
      durationMs: input.durationMs ?? null,
    });
  };
