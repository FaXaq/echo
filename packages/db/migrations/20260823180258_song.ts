import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("song")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("artist", "text")
    .addColumn("bpm", "integer")
    .addColumn("key", "text")
    .addColumn("lyrics", "text")
    .addColumn("type", "text")
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
    .createIndex("song_organization_id_index")
    .on("song")
    .column("organization_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("song").execute();
}
