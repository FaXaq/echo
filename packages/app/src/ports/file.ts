import type { AudioFile, FileType } from "@echo/domain";

export type { AudioFile, FileType };

export interface FileRepoPort {
  create: (input: {
    id: string;
    storageKey: string;
    filename: string;
    type: FileType;
    organizationId: string;
  }) => Promise<AudioFile>;
}
