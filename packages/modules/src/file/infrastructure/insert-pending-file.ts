import type { KyselyDB } from "@echo/db";
import type { FileKind, FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export type InsertPendingFileInput = {
  id: string;
  eventId: string | null;
  organizationId: string | null;
  uploadedBy: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  s3Key: string;
};

export async function insertPendingFile(
  db: KyselyDB,
  input: InsertPendingFileInput,
): Promise<FileRecord> {
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
      filename: input.originalFilename,
      original_filename: input.originalFilename,
      s3_key: input.s3Key,
      status: "pending",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const { name } = await db
    .selectFrom("user")
    .select("name")
    .where("user.id", "=", row.uploaded_by)
    .executeTakeFirstOrThrow();

  return toFileRecord({ ...row, uploaded_by_name: name });
}
