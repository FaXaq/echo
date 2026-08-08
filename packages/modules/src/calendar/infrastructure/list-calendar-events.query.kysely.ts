import type { ListCalendarEventsQueryPortFactory } from "./list-calendar-events.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const listCalendarEventsQueryFactory: ListCalendarEventsQueryPortFactory =
  () => async (db, input) => {
    if (input.organizationId) {
      const rows = await db
        .selectFrom("calendar_event")
        .innerJoin("user", "user.id", "created_by")
        .selectAll("calendar_event")
        .select("user.name as created_by_name")
        .leftJoin("organization", "organization.id", "calendar_event.organization_id")
        .select(["organization.name as organization_name", "organization.slug as organization_slug"])
        .where("organization_id", "=", input.organizationId)
        .execute();

      return rows.map(toCalendarEvent);
    }

    const rows = await db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .leftJoin("organization", "organization.id", "calendar_event.organization_id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug", "user.name as created_by_name"])
      .where((wb) =>
        wb.or([
          wb.and([
            wb("created_by", "=", input.userId),
            wb("organization_id", "is", null),
          ]),
          wb("organization_id", "in",
            db.selectFrom("member")
              .select("organizationId")
              .where("userId", "=", input.userId)
          ),
        ]),
    )
    .execute();

    return rows.map(toCalendarEvent);
  };
