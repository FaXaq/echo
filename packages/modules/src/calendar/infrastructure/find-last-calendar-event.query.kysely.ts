import type { FindLastCalendarEventQueryPortFactory } from "./find-last-calendar-event.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const findLastCalendarEventQueryFactory: FindLastCalendarEventQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .innerJoin("organization", "organization.id", "calendar_event.organization_id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("organization_id", "=", scope.organizationId)
      .where("end_date", "<", input.now)
      .orderBy("end_date", "desc")
      .limit(1)
      .executeTakeFirst();

    return row ? toCalendarEvent(row) : null;
  };
