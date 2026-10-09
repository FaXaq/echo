import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Expense } from "../domain/index.js";
import type { ListExpensesQueryPort } from "../infrastructure/list-expenses.query.port.js";

export async function listExpenses(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listExpensesQuery: ListExpensesQueryPort;
  },
  input: { scope: OrganizationScope; eventId: string | null },
): Promise<Expense[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "read" });

  return deps.listExpensesQuery(deps.db, input.scope, { eventId: input.eventId });
}
