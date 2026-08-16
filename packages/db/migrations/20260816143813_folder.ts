import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("folder")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("parent_folder_id", "text", (col) => col.references("folder.id").onDelete("cascade"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("folder_organization_id_index")
    .on("folder")
    .column("organization_id")
    .execute();

  await db.schema
    .createIndex("folder_parent_folder_id_index")
    .on("folder")
    .column("parent_folder_id")
    .execute();

  await db.schema
    .alterTable("file")
    .addColumn("folder_id", "text", (col) => col.references("folder.id").onDelete("set null"))
    .execute();

  await db.schema.createIndex("file_folder_id_index").on("file").column("folder_id").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("file").dropColumn("folder_id").execute();
  await db.schema.dropTable("folder").execute();
}
