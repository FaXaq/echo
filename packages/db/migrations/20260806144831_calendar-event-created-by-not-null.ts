import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .alterTable("calendar_event")
    .alterColumn("created_by", col => col.setNotNull())
    .alterColumn("created_at", col => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .alterTable("calendar_event")
    .alterColumn("created_by", col => col.dropNotNull())
    .alterColumn("created_at", col => col.dropNotNull())
    .execute();
}
