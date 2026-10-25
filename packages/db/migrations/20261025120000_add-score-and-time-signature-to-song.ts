import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("song")
    .addColumn("score", "text")
    .addColumn("time_signature", "text")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("song").dropColumn("score").dropColumn("time_signature").execute();
}
