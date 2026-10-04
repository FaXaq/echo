import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Repayment } from "../domain/index.js";
import type { InsertRepaymentCommandPort } from "../infrastructure/insert-repayment.command.port.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";
import { prepareRepayment, type RepaymentDraft } from "./prepare-repayment.js";

export async function createRepayment(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertRepaymentCommand: InsertRepaymentCommandPort;
    listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort;
  },
  input: { scope: OrganizationScope; userId: string; draft: RepaymentDraft },
): Promise<Repayment> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["create"] },
  });
  if (!success) throw forbidden({ entity: "Repayment", action: "create" });

  const prepared = await prepareRepayment(deps, {
    scope: input.scope,
    draft: input.draft,
    keepUserIds: [],
  });

  return deps.insertRepaymentCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    userId: input.userId,
    ...prepared,
  });
}
