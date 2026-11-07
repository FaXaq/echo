import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("file")
    .addColumn("width", "integer")
    .addColumn("height", "integer")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("file").dropColumn("width").dropColumn("height").execute();
}
