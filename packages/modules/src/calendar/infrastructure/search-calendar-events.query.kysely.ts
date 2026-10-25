import type { SearchCalendarEventsQueryPortFactory } from "./search-calendar-events.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

const SEARCH_RESULT_LIMIT = 10;

export const searchCalendarEventsQueryFactory: SearchCalendarEventsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .innerJoin("organization", "organization.id", "calendar_event.organization_id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("organization_id", "=", scope.organizationId)
      .where("title", "ilike", `%${input.query}%`)
      .orderBy("start_date", "desc")
      .limit(SEARCH_RESULT_LIMIT)
      .execute();

    return rows.map(toCalendarEvent);
  };
