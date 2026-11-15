import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";
import type {
  EventExistsInOrganizationQueryPort,
  FindFolderByIdQueryPort,
  SongExistsInOrganizationQueryPort,
} from "../infrastructure/index.js";

export async function assertPlaceExists(
  deps: {
    db: KyselyDB;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    eventExistsInOrganizationQuery: EventExistsInOrganizationQueryPort;
    songExistsInOrganizationQuery: SongExistsInOrganizationQueryPort;
  },
  scope: OrganizationScope,
  place: Place,
) {
  switch (place.kind) {
    case "root":
      return;
    case "folder":
      if (!(await deps.findFolderByIdQuery(deps.db, scope, { id: place.id }))) {
        throw notFound("Folder");
      }
      return;
    case "event":
      if (!(await deps.eventExistsInOrganizationQuery(deps.db, scope, { eventId: place.id }))) {
        throw notFound("CalendarEvent");
      }
      return;
    case "song":
      if (!(await deps.songExistsInOrganizationQuery(deps.db, scope, { songId: place.id }))) {
        throw notFound("Song");
      }
  }
}
