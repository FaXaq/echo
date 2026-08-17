import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { getFileDownloadUrl } from "./get-file-download-url.js";
import {
  makeFakeDb,
  makeFakeFindFileById,
  makeFakePermissionChecks,
  makeFakeS3Storage,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("getFileDownloadUrl", () => {
  it("rejects a member without drive:read permission", async () => {
    await expect(
      getFileDownloadUrl(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeS3Storage(),
          findFileByIdQuery: makeFakeFindFileById(),
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "file-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file doesn't exist in this organization", async () => {
    await expect(
      getFileDownloadUrl(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeS3Storage(),
          findFileByIdQuery: makeFakeFindFileById(null),
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns a presigned download URL for the file's S3 key", async () => {
    const result = await getFileDownloadUrl(
      {
        db: makeFakeDb(),
        s3Storage: makeFakeS3Storage(),
        findFileByIdQuery: makeFakeFindFileById(),
        ...makeFakePermissionChecks(),
      },
      { id: "file-1", scope },
    );

    expect(result.downloadUrl).toBe("https://fake-s3.local/org/org-1/file-1/demo.mp3?download");
  });
});
