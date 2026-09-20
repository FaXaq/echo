import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";
import type { ListOutreachCardContactsQueryPort } from "../infrastructure/list-outreach-card-contacts.query.port.js";

export async function listOutreachCardContacts(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachCardContactsQuery: ListOutreachCardContactsQueryPort;
  },
  input: { scope: OrganizationScope; cardId: string },
): Promise<OutreachContact[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["read"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "read" });

  return deps.listOutreachCardContactsQuery(deps.db, input.scope, { cardId: input.cardId });
}
