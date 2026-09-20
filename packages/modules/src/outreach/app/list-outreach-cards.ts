import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";
import type { ListOutreachCardsQueryPort } from "../infrastructure/list-outreach-cards.query.port.js";

export async function listOutreachCards(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachCardsQuery: ListOutreachCardsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<OutreachCard[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["read"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "read" });

  return deps.listOutreachCardsQuery(deps.db, input.scope);
}
