import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { DeleteExpenseCommandPort } from "../infrastructure/delete-expense.command.port.js";

export async function deleteExpense(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteExpenseCommand: DeleteExpenseCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "delete" });

  const deleted = await deps.deleteExpenseCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Expense");
}
