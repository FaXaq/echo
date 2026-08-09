import type { KyselyDB } from "@echo/db";

export async function markOrganizationPersonal(
  db: KyselyDB,
  organizationId: string,
  userId: string,
) {
  await db
    .updateTable("organization")
    .set({ isPersonal: true, createdBy: userId })
    .where("id", "=", organizationId)
    .execute();
}
