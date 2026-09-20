import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";
import type { ListOutreachColumnsQueryPort } from "../infrastructure/list-outreach-columns.query.port.js";
import type { InsertOutreachColumnCommandPort } from "../infrastructure/insert-outreach-column.command.port.js";

export async function createOutreachColumn(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachColumnsQuery: ListOutreachColumnsQueryPort;
    insertOutreachColumnCommand: InsertOutreachColumnCommandPort;
  },
  input: { scope: OrganizationScope; name: string },
): Promise<OutreachColumn> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["create"] },
  });
  if (!success) throw forbidden({ entity: "OutreachColumn", action: "create" });

  const existingColumns = await deps.listOutreachColumnsQuery(deps.db, input.scope);
  const lastPosition = existingColumns.reduce((max, column) => Math.max(max, column.position), -1);

  return deps.insertOutreachColumnCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    name: input.name,
    position: lastPosition + 1,
  });
}
