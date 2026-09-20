import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { computeReorderPosition } from "../domain/index.js";
import type { ListOutreachCardsQueryPort } from "../infrastructure/list-outreach-cards.query.port.js";
import type { MoveOutreachCardCommandPort } from "../infrastructure/move-outreach-card.command.port.js";

export async function moveOutreachCard(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachCardsQuery: ListOutreachCardsQueryPort;
    moveOutreachCardCommand: MoveOutreachCardCommandPort;
  },
  input: {
    scope: OrganizationScope;
    id: string;
    columnId: string;
    beforeId: string | null;
    afterId: string | null;
  },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "update" });

  const cards = await deps.listOutreachCardsQuery(deps.db, input.scope);
  const before = input.beforeId ? cards.find((card) => card.id === input.beforeId) : undefined;
  const after = input.afterId ? cards.find((card) => card.id === input.afterId) : undefined;

  const position = computeReorderPosition({
    before: before?.position ?? null,
    after: after?.position ?? null,
  });

  const moved = await deps.moveOutreachCardCommand(deps.db, input.scope, {
    id: input.id,
    columnId: input.columnId,
    position,
  });
  if (!moved) throw notFound("OutreachCard");
}
