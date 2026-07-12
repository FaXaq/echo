import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import type { FileRepoPort } from "../../file/infrastructure/index.js";
import { randomUUID } from "node:crypto";

export async function registerMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort; fileRepo: FileRepoPort },
  input: {
    trackId: string;
    filename: string;
    storageKey: string;
    organizationId: string;
    startMeasure: number;
    durationMs?: number | null;
  },
) {
  const fileId = randomUUID();
  await deps.fileRepo.create(deps.db, {
    id: fileId,
    storageKey: input.storageKey,
    filename: input.filename,
    type: "midi",
    organizationId: input.organizationId,
  });

  return deps.midiClipRepo.create(deps.db, {
    id: randomUUID(),
    trackId: input.trackId,
    fileId,
    startMeasure: input.startMeasure,
    durationMs: input.durationMs ?? null,
  });
}
