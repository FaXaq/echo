import type { KyselyDB } from "@echo/db";
import type { AudioFile, FileType } from "../domain/index.js";

export type { AudioFile, FileType };

export interface FileRepoPort {
  create: (
    db: KyselyDB,
    input: { id: string; storageKey: string; filename: string; type: FileType; organizationId: string },
  ) => Promise<AudioFile>;
}
