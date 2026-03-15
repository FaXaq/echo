import type { FileStoragePort } from "../../ports/file-storage";

export const makeGetUploadUrl =
  (deps: { fileStorage: FileStoragePort }) =>
  async (input: { filename: string; contentType: string; organizationId: string }) => {
    const fileId = crypto.randomUUID();
    const storageKey = `${input.organizationId}/audio-clips/${fileId}-${input.filename}`;
    const uploadUrl = await deps.fileStorage.getUploadUrl({
      key: storageKey,
      contentType: input.contentType,
    });
    return { storageKey, uploadUrl };
  };
