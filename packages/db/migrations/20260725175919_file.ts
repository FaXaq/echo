import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("file")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("event_id", "text", (col) => col.references("calendar_event.id").onDelete("cascade"))
    .addColumn("organization_id", "text", (col) => col.references("organization.id").onDelete("cascade"))
    .addColumn("uploaded_by", "text", (col) => col.notNull().references("user.id").onDelete("cascade"))
    .addColumn("kind", "text", (col) => col.notNull())
    .addColumn("mime_type", "text", (col) => col.notNull())
    .addColumn("size_bytes", "integer", (col) => col.notNull())
    .addColumn("original_filename", "text", (col) => col.notNull())
    .addColumn("s3_key", "text", (col) => col.notNull().unique())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("pending"))
    .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("file").execute();
}
