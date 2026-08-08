import type { KyselyDB } from "@echo/db";

export const makeSelectFileByIdQuery = (db: KyselyDB) => (id: string) => {
  return db
    .selectFrom("file")
    .selectAll()
    .leftJoin("user", "user.id", "file.uploaded_by")
    .select("user.name as uploaded_by_name")
    .where("file.id", "=", id)
    .executeTakeFirst();
}
