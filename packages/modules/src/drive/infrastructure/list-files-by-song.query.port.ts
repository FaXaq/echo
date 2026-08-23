import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type ListFilesBySongQueryInput = {
  songId: string;
};

export type ListFilesBySongQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListFilesBySongQueryInput,
) => Promise<FileRecord[]>;

export type ListFilesBySongQueryPortFactory = () => ListFilesBySongQueryPort;
