import { fileTypeSchema, type AudioFile, type FileType } from "../domain/index.js";
import type { FileRepoPort } from "./file-repository.port.js";

export const makeFileRepo = (): FileRepoPort => ({
  create: async (db, { id, storageKey, filename, type, organizationId }) => {
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
    type: fileTypeSchema.parse(row.type),
    organizationId: row.organizationId,
    createdAt: row.createdAt,
  };
}
