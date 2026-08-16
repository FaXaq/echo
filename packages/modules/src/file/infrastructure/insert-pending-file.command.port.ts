import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileKind, FileRecord } from "../domain/index.js";

export type InsertPendingFileInput = {
  id: string;
  eventId: string | null;
  uploadedBy: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  s3Key: string;
};

export type InsertPendingFileCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertPendingFileInput,
) => Promise<FileRecord>;

export type InsertPendingFileCommandPortFactory = () => InsertPendingFileCommandPort;
