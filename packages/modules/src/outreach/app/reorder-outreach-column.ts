import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { computeReorderPosition } from "../domain/index.js";
import type { ListOutreachColumnsQueryPort } from "../infrastructure/list-outreach-columns.query.port.js";
import type { MoveOutreachColumnCommandPort } from "../infrastructure/move-outreach-column.command.port.js";

export async function reorderOutreachColumn(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachColumnsQuery: ListOutreachColumnsQueryPort;
    moveOutreachColumnCommand: MoveOutreachColumnCommandPort;
  },
  input: { scope: OrganizationScope; id: string; beforeId: string | null; afterId: string | null },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachColumn", action: "update" });

  const columns = await deps.listOutreachColumnsQuery(deps.db, input.scope);
  const before = input.beforeId
    ? columns.find((column) => column.id === input.beforeId)
    : undefined;
  const after = input.afterId ? columns.find((column) => column.id === input.afterId) : undefined;

  const position = computeReorderPosition({
    before: before?.position ?? null,
    after: after?.position ?? null,
  });

  const moved = await deps.moveOutreachColumnCommand(deps.db, input.scope, {
    id: input.id,
    position,
  });
  if (!moved) throw notFound("OutreachColumn");
}
