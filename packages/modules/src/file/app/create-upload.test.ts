import { describe, expect, it } from "vitest";
import { ForbiddenError, ConflictError, NotFoundError } from "@echo/errors";
import type { InsertPendingFileInput } from "../infrastructure/index.js";
import { createUpload } from "./create-upload.js";
import {
  makeFakeS3Storage,
  makeFakePermissionChecks,
  makeFakeInsertPendingFile,
  makeFakePersonalOrganizationId,
} from "./test-fixtures.js";

const baseInput = {
  userId: "user-1",
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
        },
        { ...baseInput, mimeType: "application/zip" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a file over the size limit", async () => {
    await expect(
      createUpload(
        {
          insertPendingFile: makeFakeInsertPendingFile(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks(),
        },
        { ...baseInput, sizeBytes: 200 * 1024 * 1024 },
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
        },
        baseInput,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
