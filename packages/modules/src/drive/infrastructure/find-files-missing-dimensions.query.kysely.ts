import type { FindFilesMissingDimensionsQueryPortFactory } from "./find-files-missing-dimensions.query.port.js";
import { toFileRecord } from "./map-file.js";

export const findFilesMissingDimensionsQueryFactory: FindFilesMissingDimensionsQueryPortFactory =
  () => async (db) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("file.kind", "in", ["image", "video"])
      .where("file.status", "=", "uploaded")
      .where("file.has_thumbnail", "=", true)
      .where("file.width", "is", null)
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
