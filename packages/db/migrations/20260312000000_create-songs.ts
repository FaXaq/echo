import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("song")
    .addColumn("id", "varchar", (col) => col.primaryKey().notNull())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("organizationId", "varchar", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("bpm", "integer")
    .addColumn("description", "text")
    .addColumn("createdBy", "varchar", (col) =>
      col.notNull().references("user.id"),
    )
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedBy", "varchar", (col) => col.references("user.id"))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("song").execute();
}
