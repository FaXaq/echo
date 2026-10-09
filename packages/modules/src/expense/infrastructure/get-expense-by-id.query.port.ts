import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Expense } from "../domain/index.js";

export type GetExpenseByIdInput = { id: string };

export type GetExpenseByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetExpenseByIdInput,
) => Promise<Expense | undefined>;

export type GetExpenseByIdQueryPortFactory = () => GetExpenseByIdQueryPort;
