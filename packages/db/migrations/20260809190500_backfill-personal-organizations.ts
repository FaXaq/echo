import { sql, type Kysely } from "kysely";
import { randomUUID } from "node:crypto";
import { generateOrgSlug } from "../src/generate-org-slug";

const MAX_SLUG_ATTEMPTS = 5;

export async function up(db: Kysely<unknown>): Promise<void> {
  const { rows: usersWithoutPersonalOrg } = await sql<{ id: string; name: string }>`
    SELECT "user"."id", "user"."name"
    FROM "user"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "member"
      JOIN "organization" ON "organization"."id" = "member"."organizationId"
      WHERE "member"."userId" = "user"."id" AND "organization"."isPersonal" = true
    )
  `.execute(db);

  for (const user of usersWithoutPersonalOrg) {
    let created = false;

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS && !created; attempt++) {
      const organizationId = randomUUID();
      const slug = generateOrgSlug();

      const insertResult = await sql`
        INSERT INTO "organization" ("id", "name", "slug", "isPersonal", "createdBy", "createdAt")
        VALUES (${organizationId}, ${`${user.name}'s organization`}, ${slug}, true, ${user.id}, now())
        ON CONFLICT ("slug") DO NOTHING
      `.execute(db);

      if (insertResult.numAffectedRows !== 1n) continue;

      await sql`
        INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt")
        VALUES (${randomUUID()}, ${organizationId}, ${user.id}, ${"owner"}, now())
      `.execute(db);

      created = true;
    }

    if (!created) {
      throw new Error(`Could not generate a unique organization slug for user ${user.id}`);
    }
  }
}

export async function down(): Promise<void> {
  // No-op: this migration only backfills data, it doesn't own a schema
  // change to reverse, and backfilled organizations are intentionally left in place.
}
