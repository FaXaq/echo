import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Repayment } from "../domain/index.js";
import type { GetRepaymentByIdQueryPort } from "../infrastructure/get-repayment-by-id.query.port.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";
import type { UpdateRepaymentCommandPort } from "../infrastructure/update-repayment.command.port.js";
import { prepareRepayment, type RepaymentDraft } from "./prepare-repayment.js";

export async function updateRepayment(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getRepaymentByIdQuery: GetRepaymentByIdQueryPort;
    updateRepaymentCommand: UpdateRepaymentCommandPort;
    listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort;
  },
  input: { scope: OrganizationScope; id: string; draft: RepaymentDraft },
): Promise<Repayment> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Repayment", action: "update" });

  const existing = await deps.getRepaymentByIdQuery(deps.db, input.scope, { id: input.id });
  if (!existing) throw notFound("Repayment");

  const prepared = await prepareRepayment(deps, {
    scope: input.scope,
    draft: input.draft,
    keepUserIds: [existing.fromUserId, existing.toUserId],
  });

  const updated = await deps.updateRepaymentCommand(deps.db, input.scope, {
    id: input.id,
    ...prepared,
  });
  if (!updated) throw notFound("Repayment");
  return updated;
}
