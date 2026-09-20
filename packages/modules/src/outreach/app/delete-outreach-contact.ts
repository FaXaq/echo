import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteOutreachContactCommandPort } from "../infrastructure/delete-outreach-contact.command.port.js";

export async function deleteOutreachContact(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteOutreachContactCommand: DeleteOutreachContactCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { contact: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "OutreachContact", action: "delete" });

  const deleted = await deps.deleteOutreachContactCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("OutreachContact");
}
