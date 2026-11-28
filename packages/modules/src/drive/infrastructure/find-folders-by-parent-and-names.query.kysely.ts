import type { FindFoldersByParentAndNamesQueryPortFactory } from "./find-folders-by-parent-and-names.query.port.js";
import { makeSelectFoldersByParentAndNamesQuery } from "./common.js";
import { toFolderRecord } from "./map-folder.js";

export const findFoldersByParentAndNamesQueryFactory: FindFoldersByParentAndNamesQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await makeSelectFoldersByParentAndNamesQuery(db)(
      scope,
      input.parentFolderId,
      input.names,
    );
    return rows.map(toFolderRecord);
  };
