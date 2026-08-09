import type { KyselyDB } from "@echo/db";

export async function getPersonalOrganizationQuery(db: KyselyDB, userId: string) {
  return db
    .selectFrom("member")
    .innerJoin("organization", "organization.id", "member.organizationId")
    .select("organization.id")
    .where("member.userId", "=", userId)
    .where("organization.isPersonal", "=", true)
    .orderBy("organization.createdAt", "asc")
    .executeTakeFirst();
}
