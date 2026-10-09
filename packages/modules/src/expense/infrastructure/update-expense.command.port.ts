import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Expense, ExpenseFields } from "../domain/index.js";

export type UpdateExpenseInput = ExpenseFields & { id: string; userId: string };

export type UpdateExpenseCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateExpenseInput,
) => Promise<Expense | undefined>;

export type UpdateExpenseCommandPortFactory = () => UpdateExpenseCommandPort;
