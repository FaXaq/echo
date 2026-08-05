import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .alterTable("calendar_event")
    .addColumn("place_name", "text")
    .addColumn("place_address", "text")
    .addColumn("place_lat", "double precision")
    .addColumn("place_lng", "double precision")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .alterTable("calendar_event")
    .dropColumn("place_name")
    .dropColumn("place_address")
    .dropColumn("place_lat")
    .dropColumn("place_lng")
    .execute();
}
