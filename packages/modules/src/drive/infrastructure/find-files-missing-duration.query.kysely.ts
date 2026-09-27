import type { FindFilesMissingDurationQueryPortFactory } from "./find-files-missing-duration.query.port.js";
import { toFileRecord } from "./map-file.js";

export const findFilesMissingDurationQueryFactory: FindFilesMissingDurationQueryPortFactory =
  () => async (db) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("file.kind", "in", ["audio", "video"])
      .where("file.status", "=", "uploaded")
      .where("file.duration_seconds", "is", null)
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
