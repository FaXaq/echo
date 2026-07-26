import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

export function makeFakeFileRepo(seed: FileRecord[] = []): FileRepoPort {
  const rows = new Map(seed.map((file) => [file.id, file]));

  return {
    insertPending: async (_db, input) => {
      const record: FileRecord = { ...input, status: "pending" };
      rows.set(record.id, record);
      return record;
    },
    markUploaded: async (_db, id) => {
      const existing = rows.get(id);
      if (!existing) return null;
      const updated: FileRecord = { ...existing, status: "uploaded" };
      rows.set(id, updated);
      return updated;
    },
    findById: async (_db, id) => rows.get(id) ?? null,
    listByEvent: async (_db, eventId) =>
      [...rows.values()].filter((f) => f.eventId === eventId && f.status === "uploaded"),
    deleteById: async (_db, id) => rows.delete(id),
  };
}

export function makeFakeS3Storage(existingKeys: string[] = []): S3StoragePort {
  const keys = new Set(existingKeys);

  return {
    createUploadUrl: async ({ key }) => {
      keys.add(key);
      return { url: `https://fake-s3.local/${key}` };
    },
    createDownloadUrl: async (key) => ({ url: `https://fake-s3.local/${key}?download` }),
    headObject: async (key) => ({ exists: keys.has(key), sizeBytes: keys.has(key) ? 1 : null }),
    deleteObject: async (key) => {
      keys.delete(key);
    },
  };
}

export function makeFakeUserPermission(
  overrides: Partial<UserPermissionRepoPort> = {},
): UserPermissionRepoPort {
  return {
    userHasPermission: async () => ({ success: true, error: null }),
    userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
    ...overrides,
  };
}
