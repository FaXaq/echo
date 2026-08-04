import type { KyselyDB } from "@echo/db";
import type { FileKind, FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function insertPendingFile(
  db: KyselyDB,
  input: {
    id: string;
    eventId: string | null;
    organizationId: string | null;
    uploadedBy: string;
    kind: FileKind;
    mimeType: string;
    sizeBytes: number;
    originalFilename: string;
    s3Key: string;
  },
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
      original_filename: input.originalFilename,
      s3_key: input.s3Key,
      status: "pending",
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const { username } = await db
    .selectFrom("user")
    .select("username")
    .where("user.id", "=", row.uploaded_by)
    .executeTakeFirstOrThrow();

  return toFileRecord({ ...row, uploadedByName: username });
}
