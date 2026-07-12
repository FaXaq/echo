import type { KyselyDB } from "@echo/db";
import type {
  SongSectionInstanceRepoPort,
  SongSectionDefinitionRepoPort,
} from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function createSectionInstance(
  deps: {
    db: KyselyDB;
    instanceRepo: SongSectionInstanceRepoPort;
    definitionRepo: SongSectionDefinitionRepoPort;
  },
  input: {
    songId: string;
    definitionId: string;
    lyricsOverride?: string | null;
    lengthMeasures?: number;
  },
) {
  const definition = await deps.definitionRepo.get(deps.db, { id: input.definitionId });
  if (!definition) throw notFound("SongSectionDefinition");

  const lengthMeasures = input.lengthMeasures ?? 8;
  const last = await deps.instanceRepo.getLastStartMeasure(deps.db, { songId: input.songId });
  const startMeasure = last ? last.startMeasure + last.lengthMeasures : 1;

  return deps.instanceRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    definitionId: input.definitionId,
    startMeasure,
    lengthMeasures,
    lyricsOverride: input.lyricsOverride ?? null,
  });
}
