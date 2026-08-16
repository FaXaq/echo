import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord, FolderRecord } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  ListFolderContentsQueryPort,
} from "../infrastructure/index.js";

export async function listFolderContents(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    listFolderContentsQuery: ListFolderContentsQueryPort;
  },
  input: { scope: OrganizationScope; folderId: string | null },
): Promise<{ folders: FolderRecord[]; files: FileRecord[] }> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  if (input.folderId !== null) {
    const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.folderId });
    if (!folder) throw notFound("Folder");
  }

  const { folders, files } = await deps.listFolderContentsQuery(deps.db, input.scope, {
    folderId: input.folderId,
  });

  return { folders, files: files.filter((file) => file.status === "uploaded") };
}
