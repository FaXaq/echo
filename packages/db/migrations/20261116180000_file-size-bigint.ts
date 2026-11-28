import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("file")
    .alterColumn("size_bytes", (col) => col.setDataType("bigint"))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("file")
    .alterColumn("size_bytes", (col) => col.setDataType("integer"))
    .execute();
}
