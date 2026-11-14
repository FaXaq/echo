import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileKind, FileRecord } from "../domain/index.js";

export type ListRecentFilesQueryInput = { kinds: FileKind[]; limit: number };

export type ListRecentFilesQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListRecentFilesQueryInput,
) => Promise<FileRecord[]>;

export type ListRecentFilesQueryPortFactory = () => ListRecentFilesQueryPort;
