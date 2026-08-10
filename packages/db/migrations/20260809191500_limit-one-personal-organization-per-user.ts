import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex("organization_created_by_personal_unique")
    .on("organization")
    .column("createdBy")
    .unique()
    .where(sql.ref("isPersonal"), "=", true)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("organization_created_by_personal_unique").execute();
}
