import { sql, type Kysely } from "kysely";
import { generateLogoPattern } from "../src/generate-logo-pattern";

export async function up(db: Kysely<unknown>): Promise<void> {
  const { rows: organizationsWithoutLogo } = await sql<{ id: string }>`
    SELECT "id" FROM "organization" WHERE "metadata" IS NULL
  `.execute(db);

  for (const organization of organizationsWithoutLogo) {
    await sql`
      UPDATE "organization"
      SET "metadata" = ${JSON.stringify({ logoPattern: generateLogoPattern() })}
      WHERE "id" = ${organization.id}
    `.execute(db);
  }
}

export async function down(): Promise<void> {
  // No-op: this migration only backfills data, it doesn't own a schema
  // change to reverse, and backfilled logo patterns are intentionally left in place.
}
