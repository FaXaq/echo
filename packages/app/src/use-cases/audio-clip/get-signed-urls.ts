import type { FileStoragePort } from "../../ports/file-storage";

export const makeGetSignedUrls =
  (deps: { fileStorage: FileStoragePort }) =>
  async (input: { storageKeys: string[] }) => {
    return Promise.all(
      input.storageKeys.map(async (key) => ({
        key,
        url: await deps.fileStorage.getDownloadUrl({ key }),
      })),
    );
  };
