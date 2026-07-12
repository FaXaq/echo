import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSectionInstance(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: {
    id: string;
    startMeasure?: number;
    lengthMeasures?: number;
    lyricsOverride?: string | null;
  },
) {
  const existing = await deps.instanceRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionInstance");
  return deps.instanceRepo.update(deps.db, input);
}
