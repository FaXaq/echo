import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteFileByIdInput = {
  id: string;
};

export type DeleteFileByIdCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteFileByIdInput,
) => Promise<boolean>;

export type DeleteFileByIdCommandPortFactory = () => DeleteFileByIdCommandPort;
