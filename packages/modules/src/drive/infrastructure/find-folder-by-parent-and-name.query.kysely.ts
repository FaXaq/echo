import type { FindFolderByParentAndNameQueryPortFactory } from "./find-folder-by-parent-and-name.query.port.js";
import { makeSelectFoldersByParentAndNamesQuery } from "./common.js";
import { toFolderRecord } from "./map-folder.js";

export const findFolderByParentAndNameQueryFactory: FindFolderByParentAndNameQueryPortFactory =
  () => async (db, scope, input) => {
    const [row] = await makeSelectFoldersByParentAndNamesQuery(db)(scope, input.parentFolderId, [
      input.name,
    ]);
    return row ? toFolderRecord(row) : null;
  };
