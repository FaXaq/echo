import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("track")
    .addColumn("id", "varchar", (col) => col.primaryKey().notNull())
    .addColumn("songId", "varchar", (col) =>
      col.notNull().references("song.id").onDelete("cascade"),
    )
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("volume", "integer", (col) => col.notNull().defaultTo(80))
    .addColumn("order", "integer", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("track").execute();
}
