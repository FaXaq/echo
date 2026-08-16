import { describe, expect, it } from "vitest";
import { ForbiddenError, ConflictError, NotFoundError, QuotaExceededError } from "@echo/errors";
import { planCatalog } from "@echo/modules/plan/domain";
import type { InsertPendingFileInput } from "../infrastructure/index.js";
import { createUpload } from "./create-upload.js";
import {
  makeFakeS3Storage,
  makeFakePermissionChecks,
  makeFakeInsertPendingFile,
  makeFakePersonalOrganizationId,
  makeFakeQuotaPorts,
} from "./test-fixtures.js";

const baseInput = {
  userId: "user-1",
  organizationId: "org-1",
  mimeType: "audio/mpeg",
  sizeBytes: 1024,
  filename: "demo.mp3",
};

describe("createUpload", () => {
  it("rejects an unsupported mime type", async () => {
    await expect(
      createUpload(
        {
          insertPendingFile: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        { ...baseInput, mimeType: "application/zip" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a personal upload when the user lacks selfCreate", async () => {
    await expect(
      createUpload(
        {
          insertPendingFile: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks({
            userHasPermission: async () => ({ success: false, error: null }),
          }),
          ...makeFakeQuotaPorts(),
        },
        baseInput,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an organization upload when the user lacks org file:create", async () => {
    await expect(
      createUpload(
        {
          insertPendingFile: makeFakeInsertPendingFile(),
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
        { ...baseInput, organizationId: "org-1" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("attributes a personal upload to the user's personal organization", async () => {
    const inserted: InsertPendingFileInput[] = [];

    await createUpload(
      {
        s3Storage: makeFakeS3Storage(),
        insertPendingFile: makeFakeInsertPendingFile((input) => inserted.push(input)),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      baseInput,
    );

    expect(inserted).toHaveLength(1);
    expect(inserted[0].organizationId).toBe("personal-org-1");
  });

  it("rejects a personal upload when the user has no personal organization", async () => {
    await expect(
      createUpload(
        {
          s3Storage: makeFakeS3Storage(),
          insertPendingFile: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId(undefined),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        baseInput,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a file larger than the plan's max file size", async () => {
    await expect(
      createUpload(
        {
          s3Storage: makeFakeS3Storage(),
          insertPendingFile: makeFakeInsertPendingFile(),
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
        s3Storage: makeFakeS3Storage(),
        insertPendingFile: makeFakeInsertPendingFile(),
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
          s3Storage: makeFakeS3Storage(),
          insertPendingFile: makeFakeInsertPendingFile(),
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
        s3Storage: makeFakeS3Storage(),
        insertPendingFile: makeFakeInsertPendingFile(),
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
          s3Storage: trackingS3,
          insertPendingFile: makeFakeInsertPendingFile(),
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
