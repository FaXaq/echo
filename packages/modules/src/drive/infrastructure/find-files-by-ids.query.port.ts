import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type FindFilesByIdsQueryInput = {
  ids: string[];
};

export type FindFilesByIdsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFilesByIdsQueryInput,
) => Promise<FileRecord[]>;

export type FindFilesByIdsQueryPortFactory = () => FindFilesByIdsQueryPort;
