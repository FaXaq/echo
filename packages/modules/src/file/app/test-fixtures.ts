import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

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

export function makeFakePermissionChecks(
  overrides: Partial<{
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  }> = {},
): {
  userHasPermission: CheckUserPermission;
  userHasPermissionInOrganization: CheckOrganizationPermission;
} {
  return {
    userHasPermission: async () => ({ success: true, error: null }),
    userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
    ...overrides,
  };
}
