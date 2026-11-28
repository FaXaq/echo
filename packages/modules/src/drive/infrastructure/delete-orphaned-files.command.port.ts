import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type DeleteOrphanedFilesInput = { fileIds: string[] };

export type DeleteOrphanedFilesCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOrphanedFilesInput,
) => Promise<Pick<FileRecord, "id" | "s3Key" | "mimeType">[]>;

export type DeleteOrphanedFilesCommandPortFactory = () => DeleteOrphanedFilesCommandPort;
