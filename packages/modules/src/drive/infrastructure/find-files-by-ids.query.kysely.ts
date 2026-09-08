import type { FindFilesByIdsQueryPortFactory } from "./find-files-by-ids.query.port.js";
import { makeSelectFilesByIdsQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

export const findFilesByIdsQueryFactory: FindFilesByIdsQueryPortFactory =
  () => async (db, scope, input) => {
    if (input.ids.length === 0) return [];

    const selectFilesByIds = makeSelectFilesByIdsQuery(db);
    const rows = await selectFilesByIds(scope, input.ids);

    return rows.map(toFileRecord);
  };
