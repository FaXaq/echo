import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("audioClip")
    .addColumn("id", "varchar", (col) => col.primaryKey().notNull())
    .addColumn("trackId", "varchar", (col) =>
      col.notNull().references("track.id").onDelete("cascade"),
    )
    .addColumn("filename", "varchar", (col) => col.notNull())
    .addColumn("storageKey", "varchar", (col) => col.notNull())
    .addColumn("durationMs", "integer")
    .addColumn("startMeasure", "double precision", (col) =>
      col.notNull().defaultTo(1),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("audioClip").execute();
}
