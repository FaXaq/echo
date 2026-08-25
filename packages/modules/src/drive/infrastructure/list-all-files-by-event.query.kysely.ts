import type { ListAllFilesByEventQueryPortFactory } from "./list-all-files-by-event.query.port.js";
import { toFileRecord } from "./map-file.js";

export const listAllFilesByEventQueryFactory: ListAllFilesByEventQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("event_id", "=", input.eventId)
      .where("organization_id", "=", scope.organizationId)
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
