import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Expense } from "../domain/index.js";

export type ListExpensesInput = { eventId: string | null };

export type ListExpensesQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListExpensesInput,
) => Promise<Expense[]>;

export type ListExpensesQueryPortFactory = () => ListExpensesQueryPort;
