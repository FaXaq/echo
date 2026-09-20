import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard, OutreachPlace } from "../domain/index.js";
import type { UpdateOutreachCardCommandPort } from "../infrastructure/update-outreach-card.command.port.js";

export async function updateOutreachCard(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updateOutreachCardCommand: UpdateOutreachCardCommandPort;
  },
  input: {
    scope: OrganizationScope;
    userId: string;
    id: string;
    title: string;
    place: OutreachPlace | null;
    description: string | null;
    assigneeId: string | null;
  },
): Promise<OutreachCard> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "update" });

  const card = await deps.updateOutreachCardCommand(deps.db, input.scope, {
    id: input.id,
    title: input.title,
    place: input.place,
    description: input.description,
    assigneeId: input.assigneeId,
    userId: input.userId,
  });
  if (!card) throw notFound("OutreachCard");
  return card;
}
