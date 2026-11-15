import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderPlace } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  MoveFilesToFolderCommandPort,
} from "../infrastructure/index.js";

export async function moveFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    moveFilesToFolderCommand: MoveFilesToFolderCommandPort;
  },
  input: {
    ids: string[];
    from: FolderPlace;
    scope: OrganizationScope;
    folderId: string | null;
  },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  if (input.folderId !== null) {
    const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.folderId });
    if (!folder) throw notFound("Folder");
  }

  const moved = await deps.moveFilesToFolderCommand(deps.db, input.scope, {
    ids: [...new Set(input.ids)],
    from: input.from,
    folderId: input.folderId,
  });
  if (!moved) throw notFound("File");
}
