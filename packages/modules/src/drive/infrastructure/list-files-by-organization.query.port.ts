import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type ListFilesByOrganizationQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<FileRecord[]>;

export type ListFilesByOrganizationQueryPortFactory = () => ListFilesByOrganizationQueryPort;
