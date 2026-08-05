import type { KyselyDB } from "@echo/db";

export async function deleteFileById(db: KyselyDB, id: string): Promise<boolean> {
  const result = await db.deleteFrom("file").where("id", "=", id).executeTakeFirst();
  return result.numDeletedRows > 0n;
}
