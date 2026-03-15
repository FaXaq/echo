import type { FileStoragePort } from "../../ports/file-storage";

export const makeGetUploadUrl =
  (deps: { fileStorage: FileStoragePort }) =>
  async (input: { filename: string; contentType: string }) => {
    const id = crypto.randomUUID();
    const storageKey = `audio-clips/${id}/${input.filename}`;
    const uploadUrl = await deps.fileStorage.getUploadUrl({
      key: storageKey,
      contentType: input.contentType,
    });
    return { storageKey, uploadUrl };
  };
