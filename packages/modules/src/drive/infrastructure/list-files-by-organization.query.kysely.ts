import type { ListFilesByOrganizationQueryPortFactory } from "./list-files-by-organization.query.port.js";
import { toFileRecord } from "./map-file.js";

export const listFilesByOrganizationQueryFactory: ListFilesByOrganizationQueryPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("organization_id", "=", scope.organizationId)
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
