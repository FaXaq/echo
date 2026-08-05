import type { ListCalendarEventsQueryPortFactory } from "./list-calendar-events.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const listCalendarEventsQueryFactory: ListCalendarEventsQueryPortFactory =
  () => async (db, input) => {
    if (input.organizationId) {
      const rows = await db
        .selectFrom("calendar_event")
        .selectAll()
        .where("organization_id", "=", input.organizationId)
        .execute();

      return rows.map(toCalendarEvent);
    }

    const organizations = await db
      .selectFrom("member")
      .select("organizationId")
      .where("userId", "=", input.userId)
      .execute();

    const organizationIds = organizations.map((o) => o.organizationId);

    const rows = await db
      .selectFrom("calendar_event")
      .selectAll()
      .where((wb) =>
        wb.or([
          wb.and([wb("created_by", "=", input.userId), wb("organization_id", "is", null)]),
          wb("organization_id", "in", organizationIds),
        ]),
      )
      .execute();

    return rows.map(toCalendarEvent);
  };
