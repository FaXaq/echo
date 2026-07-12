import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";

export async function registerAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileRepo: FileRepoPort },
  input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  },
) {
  const fileId = crypto.randomUUID();
  await deps.fileRepo.create(deps.db, {
    id: fileId,
    storageKey: input.storageKey,
    filename: input.filename,
    type: "audio",
    organizationId: input.organizationId,
  });
  return deps.audioClipRepo.create(deps.db, {
    id: crypto.randomUUID(),
    trackId: input.trackId,
    fileId,
    durationMs: input.durationMs,
    startMeasure: input.startMeasure,
  });
}
