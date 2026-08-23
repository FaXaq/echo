import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("file")
    .addColumn("song_id", "text", (col) => col.references("song.id").onDelete("set null"))
    .execute();

  await db.schema.createIndex("file_song_id_index").on("file").column("song_id").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("file").dropColumn("song_id").execute();
}
