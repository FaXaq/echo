import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteOutreachContactInput = {
  id: string;
};

export type DeleteOutreachContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOutreachContactInput,
) => Promise<boolean>;

export type DeleteOutreachContactCommandPortFactory = () => DeleteOutreachContactCommandPort;
