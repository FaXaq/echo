import type { ListFilesBySongQueryPortFactory } from "./list-files-by-song.query.port.js";
import { toFileRecord } from "./map-file.js";

export const listFilesBySongQueryFactory: ListFilesBySongQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("song_id", "=", input.songId)
      .where("organization_id", "=", scope.organizationId)
      .where("status", "=", "uploaded")
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
