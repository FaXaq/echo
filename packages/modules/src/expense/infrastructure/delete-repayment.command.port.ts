import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteRepaymentInput = { id: string };

export type DeleteRepaymentCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteRepaymentInput,
) => Promise<boolean>;

export type DeleteRepaymentCommandPortFactory = () => DeleteRepaymentCommandPort;
