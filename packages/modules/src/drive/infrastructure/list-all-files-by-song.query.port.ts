import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type ListAllFilesBySongQueryInput = {
  songId: string;
};

export type ListAllFilesBySongQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListAllFilesBySongQueryInput,
) => Promise<FileRecord[]>;

export type ListAllFilesBySongQueryPortFactory = () => ListAllFilesBySongQueryPort;
