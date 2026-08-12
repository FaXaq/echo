import type { KyselyDB } from "@echo/db";

export async function getPersonalOrganizationQuery(db: KyselyDB, userId: string) {
  return db
    .selectFrom("organization")
    .select("id")
    .where("createdBy", "=", userId)
    .where("isPersonal", "=", true)
    .executeTakeFirst();
}
