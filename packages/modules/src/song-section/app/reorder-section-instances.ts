import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function reorderSectionInstances(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { songId: string; orderedIds: string[] },
) {
  const instances = await deps.instanceRepo.list(deps.db, { songId: input.songId });
  const instanceMap = new Map(instances.map((i) => [i.id, i]));

  const updates = input.orderedIds.map((id, index) => {
    const instance = instanceMap.get(id);
    if (!instance) throw notFound("SongSectionInstance");
    const startMeasure = 1 + index * instance.lengthMeasures;
    return { id, startMeasure };
  });

  await deps.instanceRepo.updateStartMeasures(deps.db, { updates });
  return deps.instanceRepo.list(deps.db, { songId: input.songId });
}
