import type { KyselyDB } from "@echo/db";
import type { FileKind, FileRecord } from "../domain/index.js";

export interface FileRepoPort {
  insertPending: (
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
  ) => Promise<FileRecord>;

  markUploaded: (db: KyselyDB, id: string) => Promise<FileRecord | null>;

  findById: (db: KyselyDB, id: string) => Promise<FileRecord | null>;

  listByEvent: (db: KyselyDB, eventId: string) => Promise<FileRecord[]>;

  deleteById: (db: KyselyDB, id: string) => Promise<boolean>;
}
