import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type ListAllFilesByEventQueryInput = {
  eventId: string;
};

export type ListAllFilesByEventQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListAllFilesByEventQueryInput,
) => Promise<FileRecord[]>;

export type ListAllFilesByEventQueryPortFactory = () => ListAllFilesByEventQueryPort;
