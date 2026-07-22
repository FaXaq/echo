import type { KyselyDB } from "@echo/db";

export async function deleteUserCalendarEvent(
  db: KyselyDB,
  input: { id: string; userId: string },
): Promise<boolean> {
  const result = await db
    .deleteFrom("calendar_event")
    .where("id", "=", input.id)
    .where("organization_id", "is", null)
    .where("created_by", "=", input.userId)
    .executeTakeFirst();

  return result.numDeletedRows > 0n;
}
