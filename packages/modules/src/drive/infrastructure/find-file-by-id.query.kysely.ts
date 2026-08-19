import type { FindFileByIdQueryPortFactory } from "./find-file-by-id.query.port.js";
import { makeSelectFileByIdQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

export const findFileByIdQueryFactory: FindFileByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const selectFileById = makeSelectFileByIdQuery(db);

    const row = await selectFileById(scope, input.id);

    return row ? toFileRecord(row) : null;
  };
