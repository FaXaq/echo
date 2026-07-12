import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function getUploadUrl(
  deps: { fileStorage: FileStoragePort },
  input: { filename: string; contentType: string; organizationId: string },
) {
  const fileId = crypto.randomUUID();
  const storageKey = `${input.organizationId}/audio-clips/${fileId}-${input.filename}`;
  const uploadUrl = await deps.fileStorage.getUploadUrl({
    key: storageKey,
    contentType: input.contentType,
  });
  return { storageKey, uploadUrl };
}
