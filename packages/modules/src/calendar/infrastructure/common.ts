import type { KyselyDB } from "@echo/db";

export const makeSelectCalendarEventByIdQuery = (db: KyselyDB) => (id: string) => {
  return db
    .selectFrom("calendar_event")
    .innerJoin("user", "user.id", "calendar_event.created_by")
    .selectAll("calendar_event")
    .select("user.name as created_by_name")
    .leftJoin("organization", "calendar_event.organization_id", "organization.id")
    .select(["organization.name as organization_name", "organization.slug as organization_slug"])
    .where("calendar_event.id", "=", id)
    .executeTakeFirstOrThrow();
};
