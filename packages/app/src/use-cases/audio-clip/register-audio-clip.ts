import { fileTypeSchema } from "@echo/domain";
import type { AudioClipRepoPort } from "../../ports/audio-clip";
import type { FileRepoPort } from "../../ports/file";

export const makeRegisterAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort; fileRepo: FileRepoPort }) =>
  async (input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  }) => {
    const fileId = crypto.randomUUID();
    await deps.fileRepo.create({
      id: fileId,
      storageKey: input.storageKey,
      filename: input.filename,
      type: fileTypeSchema.enum.audio,
      organizationId: input.organizationId,
    });
    return deps.audioClipRepo.create({
      id: crypto.randomUUID(),
      trackId: input.trackId,
      fileId,
      durationMs: input.durationMs,
      startMeasure: input.startMeasure,
    });
  };
