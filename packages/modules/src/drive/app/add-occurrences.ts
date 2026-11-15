import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";
import type {
  EventExistsInOrganizationQueryPort,
  FindFilesByIdsQueryPort,
  FindFolderByIdQueryPort,
  InsertOccurrencesCommandPort,
  SongExistsInOrganizationQueryPort,
} from "../infrastructure/index.js";
import { assertPlaceExists } from "./assert-place-exists.js";

export async function addOccurrences(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFilesByIdsQuery: FindFilesByIdsQueryPort;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    eventExistsInOrganizationQuery: EventExistsInOrganizationQueryPort;
    songExistsInOrganizationQuery: SongExistsInOrganizationQueryPort;
    insertOccurrencesCommand: InsertOccurrencesCommandPort;
  },
  input: { fileIds: string[]; place: Place; userId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  await assertPlaceExists(deps, input.scope, input.place);

  const fileIds = [...new Set(input.fileIds)];
  const files = await deps.findFilesByIdsQuery(deps.db, input.scope, { ids: fileIds });
  if (files.length !== fileIds.length) throw notFound("File");

  await deps.insertOccurrencesCommand(deps.db, input.scope, {
    fileIds,
    place: input.place,
    addedBy: input.userId,
  });
}
