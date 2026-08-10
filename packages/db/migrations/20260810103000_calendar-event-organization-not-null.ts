import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE "calendar_event"
    SET "organization_id" = "organization"."id"
    FROM "organization"
    WHERE "calendar_event"."organization_id" IS NULL
      AND "organization"."createdBy" = "calendar_event"."created_by"
      AND "organization"."isPersonal" = true
  `.execute(db);

  await db.schema
    .alterTable("calendar_event")
    .alterColumn("organization_id", (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("calendar_event")
    .alterColumn("organization_id", (col) => col.dropNotNull())
    .execute();
}
