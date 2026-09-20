import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";
import type { ListOutreachColumnsQueryPort } from "../infrastructure/list-outreach-columns.query.port.js";
import type { SeedDefaultOutreachColumnsCommandPort } from "../infrastructure/seed-default-outreach-columns.command.port.js";

export async function listOutreachColumns(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listOutreachColumnsQuery: ListOutreachColumnsQueryPort;
    seedDefaultOutreachColumnsCommand: SeedDefaultOutreachColumnsCommandPort;
  },
  input: { scope: OrganizationScope },
): Promise<OutreachColumn[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { outreach: ["read"] },
  });
  if (!success) throw forbidden({ entity: "OutreachColumn", action: "read" });

  const columns = await deps.listOutreachColumnsQuery(deps.db, input.scope);
  if (columns.length > 0) return columns;

  return deps.seedDefaultOutreachColumnsCommand(deps.db, input.scope);
}
