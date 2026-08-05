import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .createTable("calendar_event")
    .addColumn("id", "text", col => col.primaryKey().notNull())
    .addColumn("title", "text", col => col.notNull())
    .addColumn("description", "text")
    .addColumn("start_date", "timestamptz", col => col.notNull())
    .addColumn("end_date", "timestamptz", col => col.notNull())
    .addColumn("all_day", "boolean", col => col.defaultTo(false))
    .addColumn("color", "text", col => col.notNull().defaultTo("blue"))
    .addColumn("organization_id", "text", col => col.references("organization.id").onDelete("cascade"))
    .addColumn("created_by", "text", col => col.references("user.id").onDelete("cascade"))
    .addColumn("updated_by", "text", col => col.references("user.id").onDelete("cascade"))
    .addColumn("created_at", "timestamptz", col => col.defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", col => col.defaultTo(sql`now()`))
    .execute()

}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db
    .schema
    .dropTable("calendar_event")
    .execute();
}
