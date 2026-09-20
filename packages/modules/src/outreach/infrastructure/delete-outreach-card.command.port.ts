import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteOutreachCardInput = {
  id: string;
};

export type DeleteOutreachCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOutreachCardInput,
) => Promise<boolean>;

export type DeleteOutreachCardCommandPortFactory = () => DeleteOutreachCardCommandPort;
