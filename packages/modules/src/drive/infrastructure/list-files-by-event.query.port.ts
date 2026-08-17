import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type ListFilesByEventQueryInput = {
  eventId: string;
};

export type ListFilesByEventQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListFilesByEventQueryInput,
) => Promise<FileRecord[]>;

export type ListFilesByEventQueryPortFactory = () => ListFilesByEventQueryPort;
