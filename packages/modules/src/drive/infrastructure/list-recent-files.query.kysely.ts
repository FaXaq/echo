import type { ListRecentFilesQueryPortFactory } from "./list-recent-files.query.port.js";
import { toFileRecord } from "./map-file.js";

export const listRecentFilesQueryFactory: ListRecentFilesQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("organization_id", "=", scope.organizationId)
      .where("status", "=", "uploaded")
      .where("kind", "in", input.kinds)
      .orderBy("file.created_at", "desc")
      .limit(input.limit)
      .execute();

    return rows.map(toFileRecord);
  };
