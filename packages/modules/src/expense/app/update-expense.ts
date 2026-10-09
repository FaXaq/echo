import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { GetCalendarEventByIdQueryPort } from "@echo/modules/calendar/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Expense } from "../domain/index.js";
import type { GetExpenseByIdQueryPort } from "../infrastructure/get-expense-by-id.query.port.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";
import type { UpdateExpenseCommandPort } from "../infrastructure/update-expense.command.port.js";
import { prepareExpense, type ExpenseDraft } from "./prepare-expense.js";

export async function updateExpense(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getExpenseByIdQuery: GetExpenseByIdQueryPort;
    updateExpenseCommand: UpdateExpenseCommandPort;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
    listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort;
    getCalendarEventByIdQuery: GetCalendarEventByIdQueryPort;
  },
  input: { scope: OrganizationScope; userId: string; id: string; draft: ExpenseDraft },
): Promise<Expense> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "update" });

  const existing = await deps.getExpenseByIdQuery(deps.db, input.scope, { id: input.id });
  if (!existing) throw notFound("Expense");

  const prepared = await prepareExpense(deps, {
    scope: input.scope,
    draft: input.draft,
    keepUserIds: [existing.payerId, ...existing.shares.map((share) => share.userId)],
  });

  const updated = await deps.updateExpenseCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    ...prepared,
  });
  if (!updated) throw notFound("Expense");
  return updated;
}
