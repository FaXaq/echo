import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";
import type { ListOutreachContactsQueryPort } from "../infrastructure/list-outreach-contacts.query.port.js";

export async function listOutreachContacts(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachContactsQuery: ListOutreachContactsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<OutreachContact[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["read"] },
  });
  if (!success) throw forbidden({ entity: "OutreachContact", action: "read" });

  return deps.listOutreachContactsQuery(deps.db, input.scope);
}
