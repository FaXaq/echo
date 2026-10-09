import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { DeleteRepaymentCommandPort } from "../infrastructure/delete-repayment.command.port.js";

export async function deleteRepayment(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteRepaymentCommand: DeleteRepaymentCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Repayment", action: "delete" });

  const deleted = await deps.deleteRepaymentCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Repayment");
}
