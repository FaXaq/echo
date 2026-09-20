import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";
import type { ListContactsQueryPort } from "../infrastructure/list-contacts.query.port.js";

export async function listContacts(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listContactsQuery: ListContactsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<Contact[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Contact", action: "read" });

  return deps.listContactsQuery(deps.db, input.scope);
}
