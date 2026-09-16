import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type FindOrphanedFilesForEventQueryInput = {
  eventId: string;
};

export type FindOrphanedFilesForEventQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindOrphanedFilesForEventQueryInput,
) => Promise<FileRecord[]>;

export type FindOrphanedFilesForEventQueryPortFactory = () => FindOrphanedFilesForEventQueryPort;
