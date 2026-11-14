import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileKind, FileRecord, MediaMetadata, Place } from "../domain/index.js";

export type InsertPendingFileInput = MediaMetadata & {
  id: string;
  place: Place;
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
