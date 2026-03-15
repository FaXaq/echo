import type { KyselyDB } from "@echo/db";
import type { FileRepoPort, AudioFile, FileType } from "@echo/app";

export const makeFileRepo = ({ db }: { db: KyselyDB }): FileRepoPort => ({
  create: async ({ id, storageKey, filename, type, organizationId }) => {
    const row = await db
      .insertInto("file")
      .values({ id, storageKey, filename, type, organizationId })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toFile(row);
  },
});

function toFile(row: {
  id: string;
  storageKey: string;
  filename: string;
  type: string;
  organizationId: string;
  createdAt: Date;
}): AudioFile {
  return {
    id: row.id,
    storageKey: row.storageKey,
    filename: row.filename,
    type: row.type as FileType,
    organizationId: row.organizationId,
    createdAt: row.createdAt,
  };
}
