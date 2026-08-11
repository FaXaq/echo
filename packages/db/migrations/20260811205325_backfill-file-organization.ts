import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    UPDATE "file" AS f
    SET "organization_id" = m."organizationId"
    FROM "member" AS m
    JOIN "organization" AS o ON o."id" = m."organizationId"
    WHERE f."organization_id" IS NULL
      AND m."userId" = f."uploaded_by"
      AND o."isPersonal" = true
  `.execute(db);
}

export async function down(): Promise<void> {}
