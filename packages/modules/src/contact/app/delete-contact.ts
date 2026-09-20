import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteContactCommandPort } from "../infrastructure/delete-contact.command.port.js";

export async function deleteContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteContactCommand: DeleteContactCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Contact", action: "delete" });

  const deleted = await deps.deleteContactCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Contact");
}
