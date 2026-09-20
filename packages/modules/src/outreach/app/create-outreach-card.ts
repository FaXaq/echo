import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard, OutreachPlace } from "../domain/index.js";
import type { ListOutreachCardsQueryPort } from "../infrastructure/list-outreach-cards.query.port.js";
import type { InsertOutreachCardCommandPort } from "../infrastructure/insert-outreach-card.command.port.js";

export async function createOutreachCard(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachCardsQuery: ListOutreachCardsQueryPort;
    insertOutreachCardCommand: InsertOutreachCardCommandPort;
  },
  input: {
    scope: OrganizationScope;
    userId: string;
    columnId: string;
    title: string;
    place: OutreachPlace | null;
    description: string | null;
    assigneeId: string | null;
  },
): Promise<OutreachCard> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["create"] },
  });
  if (!success) throw forbidden({ entity: "OutreachCard", action: "create" });

  const cardsInColumn = (await deps.listOutreachCardsQuery(deps.db, input.scope)).filter(
    (card) => card.columnId === input.columnId,
  );
  const lastPosition = cardsInColumn.reduce((max, card) => Math.max(max, card.position), -1);

  const card = await deps.insertOutreachCardCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    columnId: input.columnId,
    position: lastPosition + 1,
    title: input.title,
    place: input.place,
    description: input.description,
    assigneeId: input.assigneeId,
    userId: input.userId,
  });
  if (!card) throw notFound("OutreachColumn");
  return card;
}
