import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaceLabel } from "../domain/index.js";
import type { ListFileOccurrencesQueryPort } from "../infrastructure/index.js";

export async function listFileOccurrences(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listFileOccurrencesQuery: ListFileOccurrencesQueryPort;
  },
  input: { fileIds: string[]; scope: OrganizationScope },
): Promise<Record<string, PlaceLabel[]>> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "list occurrences" });

  return deps.listFileOccurrencesQuery(deps.db, input.scope, { fileIds: input.fileIds });
}
