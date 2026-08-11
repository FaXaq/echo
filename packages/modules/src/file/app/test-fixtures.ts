import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { planCatalog } from "@echo/modules/plan/domain";
import type {
  GetOrganizationStorageUsagePort,
  ResolveEntitlementsPort,
} from "@echo/modules/plan/app";
import type { FileRecord } from "../domain/index.js";
import type { InsertPendingFileInput } from "../infrastructure/index.js";
import type { GetPersonalOrganizationIdPort, InsertPendingFilePort } from "./create-upload.js";
import type { FindFileByIdPort, MarkFileUploadedPort } from "./confirm-upload.js";

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

export function makeFakePersonalOrganizationId(
  organizationId: string | undefined,
): GetPersonalOrganizationIdPort {
  return async () => organizationId;
}

export function makeFakeQuotaPorts(
  overrides: Partial<{
    resolveOrganizationEntitlements: ResolveEntitlementsPort;
    getOrganizationStorageUsage: GetOrganizationStorageUsagePort;
  }> = {},
) {
  return {
    resolveOrganizationEntitlements: async () => planCatalog.free,
    getOrganizationStorageUsage: async () => 0,
    ...overrides,
  };
}

export function makeFakeInsertPendingFile(
  onInsert?: (input: InsertPendingFileInput) => void,
): InsertPendingFilePort {
  return async (input) => {
    onInsert?.(input);
    const record: FileRecord = {
      id: input.id,
      eventId: input.eventId,
      organizationId: input.organizationId,
      uploadedBy: input.uploadedBy,
      uploadedByName: "Test User",
      kind: input.kind,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      filename: input.originalFilename,
      originalFilename: input.originalFilename,
      s3Key: input.s3Key,
      status: "pending",
      createdAt: null,
      updatedAt: null,
    };
    return record;
  };
}

export function makeFakeFileRecord(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "file-1",
    eventId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Test User",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 1024,
    filename: "demo.mp3",
    originalFilename: "demo.mp3",
    s3Key: "org/org-1/file-1/demo.mp3",
    status: "pending",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

export function makeFakeHeadObjectS3(result: {
  exists: boolean;
  sizeBytes: number | null;
}): S3StoragePort {
  return {
    createUploadUrl: async () => ({ url: "" }),
    createDownloadUrl: async () => ({ url: "" }),
    headObject: async () => result,
    deleteObject: async () => {},
  };
}

export function makeFakeMarkFileUploaded(
  onCall?: (id: string, sizeBytes: number | null) => void,
): MarkFileUploadedPort {
  return async (id, sizeBytes) => {
    onCall?.(id, sizeBytes);
    return makeFakeFileRecord({ id, status: "uploaded", sizeBytes: sizeBytes ?? 1024 });
  };
}

export function makeFakeFindFileById(
  record: FileRecord | null = makeFakeFileRecord(),
): FindFileByIdPort {
  return async () => record;
}
