import type { FindFolderDescendantIdsQueryPortFactory } from "./find-folder-descendant-ids.query.port.js";
import { selectFolderAndDescendantIds } from "./common.js";

export const findFolderDescendantIdsQueryFactory: FindFolderDescendantIdsQueryPortFactory =
  () => async (db, scope, input) => {
    const ids = await selectFolderAndDescendantIds(db, scope, input.id);
    return ids.filter((id) => id !== input.id);
  };
