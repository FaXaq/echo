import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "./file-repository.port.js";

type FileRow = {
  id: string;
  event_id: string | null;
  organization_id: string | null;
  uploaded_by: string;
  kind: string;
  mime_type: string;
  size_bytes: number;
  original_filename: string;
  s3_key: string;
  status: string;
};

function toFileRecord(row: FileRow): FileRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    organizationId: row.organization_id,
    uploadedBy: row.uploaded_by,
    kind: row.kind as FileRecord["kind"],
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    originalFilename: row.original_filename,
    s3Key: row.s3_key,
    status: row.status as FileRecord["status"],
  };
}

export const makeFileRepo = (): FileRepoPort => ({
  insertPending: async (db, input) => {
    const row = await db
      .insertInto("file")
      .values({
        id: input.id,
        event_id: input.eventId,
        organization_id: input.organizationId,
        uploaded_by: input.uploadedBy,
        kind: input.kind,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        original_filename: input.originalFilename,
        s3_key: input.s3Key,
        status: "pending",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toFileRecord(row as FileRow);
  },

  markUploaded: async (db, id) => {
    const row = await db
      .updateTable("file")
      .set({ status: "uploaded", updated_at: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    return row ? toFileRecord(row as FileRow) : null;
  },

  findById: async (db, id) => {
    const row = await db.selectFrom("file").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? toFileRecord(row as FileRow) : null;
  },

  listByEvent: async (db, eventId) => {
    const rows = await db
      .selectFrom("file")
      .selectAll()
      .where("event_id", "=", eventId)
      .where("status", "=", "uploaded")
      .execute();

    return rows.map((row) => toFileRecord(row as FileRow));
  },

  deleteById: async (db, id) => {
    const result = await db.deleteFrom("file").where("id", "=", id).executeTakeFirst();
    return result.numDeletedRows > 0n;
  },
});
