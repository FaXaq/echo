import { describe, expect, it } from "vitest";
import { ForbiddenError, ConflictError, QuotaExceededError } from "@echo/errors";
import { planCatalog } from "@echo/modules/plan/domain";
import { createOrganizationScope, type OrganizationScope } from "@echo/modules/shared/domain";
import type { InsertPendingFileInput } from "../infrastructure/index.js";
import { createUpload } from "./create-upload.js";
import {
  makeFakeDb,
  makeFakeS3Storage,
  makeFakePermissionChecks,
  makeFakeInsertPendingFile,
  makeFakePersonalOrganizationId,
  makeFakeQuotaPorts,
  makeFakeFindFolderById,
} from "./test-fixtures.js";

const baseInput = {
  userId: "user-1",
  scope: createOrganizationScope("org-1"),
  mimeType: "audio/mpeg",
  sizeBytes: 1024,
  filename: "demo.mp3",
};

describe("createUpload", () => {
  it("rejects an unsupported mime type", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        { ...baseInput, mimeType: "application/zip" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an organization upload when the user lacks org drive:create", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
          ...makeFakeQuotaPorts(),
        },
        baseInput,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("attributes the upload to the requested organization", async () => {
    const inserted: { scope: OrganizationScope; input: InsertPendingFileInput }[] = [];

    await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile((scope, input) =>
          inserted.push({ scope, input }),
        ),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      baseInput,
    );

    expect(inserted).toHaveLength(1);
    expect(inserted[0].scope.organizationId).toBe("org-1");
  });

  it("rejects a file larger than the plan's max file size", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: makeFakeS3Storage(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        { ...baseInput, sizeBytes: planCatalog.free.limits.maxFileSizeBytes + 1 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("allows a file exactly at the plan's max file size", async () => {
    const result = await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      { ...baseInput, sizeBytes: planCatalog.free.limits.maxFileSizeBytes },
    );

    expect(result.uploadUrl).toContain("https://fake-s3.local/");
  });

  it("rejects an upload that would exceed the storage quota", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: makeFakeS3Storage(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts({
            getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes - 100,
          }),
        },
        { ...baseInput, sizeBytes: 101 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("allows an upload that lands exactly on the storage quota", async () => {
    const result = await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts({
          getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes - 100,
        }),
      },
      { ...baseInput, sizeBytes: 100 },
    );

    expect(result.uploadUrl).toContain("https://fake-s3.local/");
  });

  it("issues no upload url when the quota rejects the request", async () => {
    const issued: string[] = [];
    const s3Storage = makeFakeS3Storage();
    const trackingS3 = {
      ...s3Storage,
      createUploadUrl: async (args: {
        key: string;
        contentType: string;
        contentLength: number;
      }) => {
        issued.push(args.key);
        return s3Storage.createUploadUrl(args);
      },
    };

    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: trackingS3,
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts({
            getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes,
          }),
        },
        { ...baseInput, sizeBytes: 1 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);

    expect(issued).toEqual([]);
  });
});
