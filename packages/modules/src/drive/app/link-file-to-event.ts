import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FindFileByIdQueryPort, LinkFileToEventCommandPort } from "../infrastructure/index.js";

export async function linkFileToEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFileByIdQuery: FindFileByIdQueryPort;
    linkFileToEventCommand: LinkFileToEventCommandPort;
  },
  input: { fileId: string; eventId: string; scope: OrganizationScope },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "link to event" });

  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.fileId });
  if (!file) throw notFound("File");

  const linked = await deps.linkFileToEventCommand(deps.db, input.scope, {
    eventId: input.eventId,
    fileId: input.fileId,
  });
  if (!linked) throw notFound("CalendarEvent");
}
