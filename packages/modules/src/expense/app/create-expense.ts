import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { GetCalendarEventByIdQueryPort } from "@echo/modules/calendar/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Expense } from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { InsertExpenseCommandPort } from "../infrastructure/insert-expense.command.port.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";
import { prepareExpense, type ExpenseDraft } from "./prepare-expense.js";

export async function createExpense(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertExpenseCommand: InsertExpenseCommandPort;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
    listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort;
    getCalendarEventByIdQuery: GetCalendarEventByIdQueryPort;
  },
  input: { scope: OrganizationScope; userId: string; draft: ExpenseDraft },
): Promise<Expense> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["create"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "create" });

  const prepared = await prepareExpense(deps, {
    scope: input.scope,
    draft: input.draft,
    keepUserIds: [],
  });

  return deps.insertExpenseCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    userId: input.userId,
    ...prepared,
  });
}
