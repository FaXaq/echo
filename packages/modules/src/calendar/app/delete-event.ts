import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { DeleteOrphanedFilesCommandPort } from "@echo/modules/drive/infrastructure";
import { purgeOrphanedFiles } from "@echo/modules/drive/app";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { DeleteCalendarEventCommandPort } from "../infrastructure/delete-calendar-event.command.port.js";

export type DeleteEventFileFailure = { fileId: string; error: unknown };

export async function deleteEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteCalendarEventCommand: DeleteCalendarEventCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
    s3Storage: S3StoragePort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteEventFileFailure[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "delete" });

  const deleted = await deps.deleteCalendarEventCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("CalendarEvent");

  const { failures } = await purgeOrphanedFiles(deps, {
    scope: input.scope,
    fileIds: deleted.fileIds,
  });
  return failures;
}
