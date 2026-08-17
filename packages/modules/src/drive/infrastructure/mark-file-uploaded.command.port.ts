import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type MarkFileUploadedInput = {
  id: string;
  sizeBytes: number | null;
};

export type MarkFileUploadedCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MarkFileUploadedInput,
) => Promise<FileRecord | null>;

export type MarkFileUploadedCommandPortFactory = () => MarkFileUploadedCommandPort;
