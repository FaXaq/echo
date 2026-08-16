import type { Selectable } from "kysely";
import type { FileKind, FileRecord, FileStatus } from "../domain/index.js";
import type { DB } from "@echo/db";

export type FileRow = Selectable<DB["file"]> & {
  uploaded_by_name: string | null;
};

function toFileKind(value: string): FileKind {
  if (value === "audio" || value === "video" || value === "image" || value === "document") {
    return value;
  }
  throw new Error(`Unknown file kind: ${value}`);
}

function toFileStatus(value: string): FileStatus {
  if (value === "pending" || value === "uploaded") return value;
  throw new Error(`Unknown file status: ${value}`);
}

export function toFileRecord(row: FileRow): FileRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    folderId: row.folder_id,
    organizationId: row.organization_id,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name ?? row.uploaded_by,
    kind: toFileKind(row.kind),
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    filename: row.filename,
    originalFilename: row.original_filename,
    s3Key: row.s3_key,
    status: toFileStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
