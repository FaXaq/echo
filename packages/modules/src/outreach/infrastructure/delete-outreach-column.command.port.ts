import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteOutreachColumnInput = {
  id: string;
};

export type DeleteOutreachColumnCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOutreachColumnInput,
) => Promise<boolean>;

export type DeleteOutreachColumnCommandPortFactory = () => DeleteOutreachColumnCommandPort;
