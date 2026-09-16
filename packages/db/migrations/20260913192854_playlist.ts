import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("playlist")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("created_by", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("updated_by", "text", (col) => col.references("user.id").onDelete("cascade"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("playlist_organization_id_index")
    .on("playlist")
    .column("organization_id")
    .execute();

  await db.schema
    .createTable("playlist_song")
    .addColumn("playlist_id", "text", (col) =>
      col.notNull().references("playlist.id").onDelete("cascade"),
    )
    .addColumn("song_id", "text", (col) => col.notNull().references("song.id").onDelete("cascade"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint("playlist_song_pkey", ["playlist_id", "song_id"])
    .execute();

  await db.schema
    .createIndex("playlist_song_song_id_index")
    .on("playlist_song")
    .column("song_id")
    .execute();

  await db.schema
    .createTable("playlist_event")
    .addColumn("playlist_id", "text", (col) =>
      col.notNull().references("playlist.id").onDelete("cascade"),
    )
    .addColumn("event_id", "text", (col) =>
      col.notNull().references("calendar_event.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint("playlist_event_pkey", ["playlist_id", "event_id"])
    .execute();

  await db.schema
    .createIndex("playlist_event_event_id_index")
    .on("playlist_event")
    .column("event_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("playlist_event").execute();
  await db.schema.dropTable("playlist_song").execute();
  await db.schema.dropTable("playlist").execute();
}
