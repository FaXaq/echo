import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";
import type { RenameOutreachColumnCommandPort } from "../infrastructure/rename-outreach-column.command.port.js";

export async function renameOutreachColumn(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    renameOutreachColumnCommand: RenameOutreachColumnCommandPort;
  },
  input: { scope: OrganizationScope; id: string; name: string },
): Promise<OutreachColumn> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["update"] },
  });
  if (!success) throw forbidden({ entity: "OutreachColumn", action: "update" });

  const column = await deps.renameOutreachColumnCommand(deps.db, input.scope, {
    id: input.id,
    name: input.name,
  });
  if (!column) throw notFound("OutreachColumn");
  return column;
}
