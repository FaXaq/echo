import type { ListFilesByEventQueryPortFactory } from "./list-files-by-event.query.port.js";
import { toFileRecord } from "./map-file.js";

export const listFilesByEventQueryFactory: ListFilesByEventQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .innerJoin("event_file", "event_file.file_id", "file.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("event_file.event_id", "=", input.eventId)
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.status", "=", "uploaded")
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
