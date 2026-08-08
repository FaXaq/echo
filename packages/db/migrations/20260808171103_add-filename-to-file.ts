import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("file")
    .addColumn("filename", "text")
    .execute();

  await sql`UPDATE "file" SET "filename" = "original_filename" WHERE "filename" IS NULL`.execute(db);

  await db.schema.alterTable("file")
    .alterColumn("filename", col => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("file")
    .dropColumn("filename")
    .execute();
}
