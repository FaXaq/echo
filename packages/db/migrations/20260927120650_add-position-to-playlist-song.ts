import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("playlist_song").addColumn("position", "real").execute();

  await sql`
    UPDATE "playlist_song" AS ps
    SET "position" = ranked."position"
    FROM (
      SELECT
        "playlist_id",
        "song_id",
        ROW_NUMBER() OVER (PARTITION BY "playlist_id" ORDER BY "created_at") - 1 AS "position"
      FROM "playlist_song"
    ) AS ranked
    WHERE ps."playlist_id" = ranked."playlist_id" AND ps."song_id" = ranked."song_id"
  `.execute(db);

  await db.schema
    .alterTable("playlist_song")
    .alterColumn("position", (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("playlist_song").dropColumn("position").execute();
}
