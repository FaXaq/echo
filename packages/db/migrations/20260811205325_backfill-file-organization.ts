import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE "file" AS f
    SET "organization_id" = o."id"
    FROM "organization" AS o
    WHERE f."organization_id" IS NULL
      AND o."createdBy" = f."uploaded_by"
      AND o."isPersonal" = true
  `.execute(db);
}

export async function down(): Promise<void> {}
