import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Expense, ExpenseFields } from "../domain/index.js";

export type InsertExpenseInput = ExpenseFields & { id: string; userId: string };

export type InsertExpenseCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertExpenseInput,
) => Promise<Expense>;

export type InsertExpenseCommandPortFactory = () => InsertExpenseCommandPort;
