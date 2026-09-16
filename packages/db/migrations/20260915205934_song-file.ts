import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("song_file")
    .addColumn("song_id", "text", (col) => col.notNull().references("song.id").onDelete("cascade"))
    .addColumn("file_id", "text", (col) => col.notNull().references("file.id").onDelete("cascade"))
    .addColumn("role", "text")
    .addColumn("linked_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("linked_by", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addPrimaryKeyConstraint("song_file_pkey", ["song_id", "file_id"])
    .execute();

  await db.schema
    .createIndex("song_file_file_id_index")
    .on("song_file")
    .column("file_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("song_file").execute();
}
