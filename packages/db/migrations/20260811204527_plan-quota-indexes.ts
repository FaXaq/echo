import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex("file_organization_id_index")
    .on("file")
    .column("organization_id")
    .execute();

  await db.schema
    .createIndex("member_organization_id_index")
    .on("member")
    .column("organizationId")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("member_organization_id_index").execute();
  await db.schema.dropIndex("file_organization_id_index").execute();
}
