import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteOutreachCardCommandPort } from "../infrastructure/delete-outreach-card.command.port.js";

export async function deleteOutreachCard(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteOutreachCardCommand: DeleteOutreachCardCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "delete" });

  const deleted = await deps.deleteOutreachCardCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("OutreachCard");
}
