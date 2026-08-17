import type { FindFolderByIdQueryPortFactory } from "./find-folder-by-id.query.port.js";
import { makeSelectFolderByIdQuery } from "./common.js";
import { toFolderRecord } from "./map-folder.js";

export const findFolderByIdQueryFactory: FindFolderByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const selectFolderById = makeSelectFolderByIdQuery(db);

    const row = await selectFolderById(scope, input.id);

    return row ? toFolderRecord(row) : null;
  };
