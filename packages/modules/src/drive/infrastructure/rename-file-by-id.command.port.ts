import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type RenameFileByIdInput = {
  id: string;
  filename: string;
};

export type RenameFileByIdCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: RenameFileByIdInput,
) => Promise<FileRecord | null>;

export type RenameFileByIdCommandPortFactory = () => RenameFileByIdCommandPort;
