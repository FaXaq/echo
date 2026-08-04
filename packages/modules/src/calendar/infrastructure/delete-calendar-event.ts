import type { KyselyDB } from "@echo/db";

export async function deleteCalendarEvent(
  db: KyselyDB,
  input: { id: string; organizationId: string | null; userId: string },
): Promise<boolean> {
  let query = db.deleteFrom("calendar_event").where("id", "=", input.id);

  if (input.organizationId === null) {
    query = query.where("organization_id", "is", null).where("created_by", "=", input.userId);
  } else {
    query = query.where("organization_id", "=", input.organizationId);
  }

  const result = await query.executeTakeFirst();

  return result.numDeletedRows > 0n;
}
