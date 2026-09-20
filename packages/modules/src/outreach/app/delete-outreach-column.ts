import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CountOutreachCardsInColumnQueryPort } from "../infrastructure/count-outreach-cards-in-column.query.port.js";
import type { DeleteOutreachColumnCommandPort } from "../infrastructure/delete-outreach-column.command.port.js";

export async function deleteOutreachColumn(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    countOutreachCardsInColumnQuery: CountOutreachCardsInColumnQueryPort;
    deleteOutreachColumnCommand: DeleteOutreachColumnCommandPort;
  },
  input: { scope: OrganizationScope; id: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "OutreachColumn", action: "delete" });

  const cardCount = await deps.countOutreachCardsInColumnQuery(deps.db, input.scope, {
    columnId: input.id,
  });
  if (cardCount > 0) {
    throw conflict("Move or delete every card out of this column before deleting it");
  }

  const deleted = await deps.deleteOutreachColumnCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("OutreachColumn");
}
