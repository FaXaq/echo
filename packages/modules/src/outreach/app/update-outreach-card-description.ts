import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";
import type { UpdateOutreachCardDescriptionCommandPort } from "../infrastructure/update-outreach-card-description.command.port.js";

export async function updateOutreachCardDescription(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updateOutreachCardDescriptionCommand: UpdateOutreachCardDescriptionCommandPort;
  },
  input: { scope: OrganizationScope; userId: string; id: string; description: string | null },
): Promise<OutreachCard> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "update" });

  const card = await deps.updateOutreachCardDescriptionCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    description: input.description,
  });
  if (!card) throw notFound("OutreachCard");
  return card;
}
