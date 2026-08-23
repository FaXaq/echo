import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type {
  DeleteFileByIdCommandPort,
  ListFilesByEventQueryPort,
} from "@echo/modules/drive/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { DeleteCalendarEventCommandPort } from "../infrastructure/delete-calendar-event.command.port.js";

export type DeleteEventFileFailure = { fileId: string; error: unknown };

export async function deleteEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteCalendarEventCommand: DeleteCalendarEventCommandPort;
    listFilesByEventQuery: ListFilesByEventQueryPort;
    deleteFileByIdCommand: DeleteFileByIdCommandPort;
    s3Storage: S3StoragePort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteEventFileFailure[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "delete" });

  const files = await deps.listFilesByEventQuery(deps.db, input.scope, { eventId: input.id });
  const orphanedFiles = files.filter((file) => file.songId === null);

  const results = await Promise.allSettled(
    orphanedFiles.map((file) => deps.s3Storage.deleteObject(file.s3Key)),
  );
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ fileId: orphanedFiles[index]!.id, error: result.reason }]
      : [],
  );

  await Promise.all(
    orphanedFiles.map((file) => deps.deleteFileByIdCommand(deps.db, input.scope, { id: file.id })),
  );

  const deleted = await deps.deleteCalendarEventCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("CalendarEvent");

  return failures;
}
