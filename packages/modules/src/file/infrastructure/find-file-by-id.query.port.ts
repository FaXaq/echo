import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type FindFileByIdQueryInput = {
  id: string;
};

export type FindFileByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFileByIdQueryInput,
) => Promise<FileRecord | null>;

export type FindFileByIdQueryPortFactory = () => FindFileByIdQueryPort;
