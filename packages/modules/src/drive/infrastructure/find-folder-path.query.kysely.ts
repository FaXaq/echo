import type { FindFolderPathQueryPortFactory } from "./find-folder-path.query.port.js";
import { selectFolderPaths } from "./common.js";

export const findFolderPathQueryFactory: FindFolderPathQueryPortFactory =
  () => async (db, scope, input) =>
    (await selectFolderPaths(db, scope, [input.id])).get(input.id) ?? [];
