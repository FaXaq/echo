import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function listFilesByEvent(db: KyselyDB, eventId: string): Promise<FileRecord[]> {
  const rows = await db
    .selectFrom("file")
    .innerJoin("user", "file.uploaded_by", "user.id")
    .selectAll("file")
    .select("user.name as uploadedByName")
    .where("event_id", "=", eventId)
    .where("status", "=", "uploaded")
    .execute();

  return rows.map(row => toFileRecord({ ...row, uploadedByName: row.uploadedByName }));
}
