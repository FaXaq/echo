import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Repayment } from "../domain/index.js";
import type { ListRepaymentsQueryPort } from "../infrastructure/list-repayments.query.port.js";

export async function listRepayments(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listRepaymentsQuery: ListRepaymentsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<Repayment[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Repayment", action: "read" });

  return deps.listRepaymentsQuery(deps.db, input.scope);
}
