import type { FindFoldersByIdsQueryPortFactory } from "./find-folders-by-ids.query.port.js";
import { toFolderRecord } from "./map-folder.js";

export const findFoldersByIdsQueryFactory: FindFoldersByIdsQueryPortFactory =
  () => async (db, scope, input) => {
    if (input.ids.length === 0) return [];
    const rows = await db
      .selectFrom("folder")
      .selectAll()
      .where("id", "in", input.ids)
      .where("organization_id", "=", scope.organizationId)
      .execute();
    return rows.map(toFolderRecord);
  };
