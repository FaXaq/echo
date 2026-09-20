import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteContactInput = {
  id: string;
};

export type DeleteContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteContactInput,
) => Promise<boolean>;

export type DeleteContactCommandPortFactory = () => DeleteContactCommandPort;
