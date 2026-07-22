import type { KyselyDB } from "@echo/db";

export async function deleteOrganizationCalendarEvent(
  db: KyselyDB,
  input: { id: string; organizationId: string },
): Promise<boolean> {
  const result = await db
    .deleteFrom("calendar_event")
    .where("id", "=", input.id)
    .where("organization_id", "=", input.organizationId)
    .executeTakeFirst();

  return result.numDeletedRows > 0n;
}
