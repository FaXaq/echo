import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function getSignedUrls(
  deps: { fileStorage: FileStoragePort },
  input: { storageKeys: string[] },
) {
  return Promise.all(
    input.storageKeys.map(async (key) => ({
      key,
      url: await deps.fileStorage.getDownloadUrl({ key }),
    })),
  );
}
