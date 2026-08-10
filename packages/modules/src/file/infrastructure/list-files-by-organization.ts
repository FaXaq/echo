import type { KyselyDB } from "@echo/db";

export async function listFilesByOrganization(
  db: KyselyDB,
  organizationId: string,
): Promise<{ id: string; s3Key: string }[]> {
  return db
    .selectFrom("file")
    .select(["id", "s3_key as s3Key"])
    .where("organization_id", "=", organizationId)
    .execute();
}
