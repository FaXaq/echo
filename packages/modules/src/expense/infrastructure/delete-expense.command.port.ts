import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteExpenseInput = { id: string };

export type DeleteExpenseCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteExpenseInput,
) => Promise<boolean>;

export type DeleteExpenseCommandPortFactory = () => DeleteExpenseCommandPort;
