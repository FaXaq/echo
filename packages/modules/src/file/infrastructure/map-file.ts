import type { FileKind, FileRecord, FileStatus } from "../domain/index.js";

export type FileRow = {
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

function toFileKind(value: string): FileKind {
  if (value === "audio" || value === "video" || value === "image") return value;
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
    organizationId: row.organization_id,
    uploadedBy: row.uploaded_by,
    kind: toFileKind(row.kind),
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    originalFilename: row.original_filename,
    s3Key: row.s3_key,
    status: toFileStatus(row.status),
  };
}
