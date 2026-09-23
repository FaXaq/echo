import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";
import type { GetOutreachCardByIdQueryPort } from "../infrastructure/get-outreach-card-by-id.query.port.js";

export async function getOutreachCardById(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getOutreachCardByIdQuery: GetOutreachCardByIdQueryPort;
  },
  input: { scope: OrganizationScope; cardId: string },
): Promise<OutreachCard> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["read"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "read" });

  const card = await deps.getOutreachCardByIdQuery(deps.db, input.scope, { cardId: input.cardId });
  if (!card) throw notFound("OutreachCard");
  return card;
}
