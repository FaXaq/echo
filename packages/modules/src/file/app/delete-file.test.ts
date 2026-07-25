import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { deleteFile } from "./delete-file.js";
import { makeFakeFileRepo, makeFakeS3Storage, makeFakeUserPermission } from "./test-fixtures.js";

const personalFile = {
  id: "file-1",
  eventId: "event-1",
  organizationId: null,
  uploadedBy: "user-1",
  kind: "image" as const,
  mimeType: "image/png",
  sizeBytes: 100,
  originalFilename: "cover.png",
  s3Key: "personal/user-1/file-1/cover.png",
  status: "uploaded" as const,
};

const orgFile = {
  ...personalFile,
  id: "file-2",
  organizationId: "org-1",
  s3Key: "org/org-1/file-2/cover.png",
};

describe("deleteFile", () => {
  it("lets the uploader delete their own personal file", async () => {
    const fileRepo = makeFakeFileRepo([personalFile]);
    await deleteFile(
      { db: {} as never, fileRepo, s3Storage: makeFakeS3Storage(), userPermission: makeFakeUserPermission() },
      { id: "file-1", userId: "user-1" },
    );
    expect(await fileRepo.findById({} as never, "file-1")).toBeNull();
  });

  it("rejects deleting another user's personal file without system file:delete", async () => {
    const fileRepo = makeFakeFileRepo([personalFile]);
    await expect(
      deleteFile(
        {
          db: {} as never,
          fileRepo,
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission({
            userHasPermission: async () => ({ success: false, error: null }),
          }),
        },
        { id: "file-1", userId: "someone-else" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets an org member with file:delete remove another uploader's org file", async () => {
    const fileRepo = makeFakeFileRepo([orgFile]);
    await deleteFile(
      {
        db: {} as never,
        fileRepo,
        s3Storage: makeFakeS3Storage(),
        userPermission: makeFakeUserPermission(),
      },
      { id: "file-2", userId: "org-admin" },
    );
    expect(await fileRepo.findById({} as never, "file-2")).toBeNull();
  });

  it("rejects deleting an org file without ownership or org file:delete", async () => {
    const fileRepo = makeFakeFileRepo([orgFile]);
    await expect(
      deleteFile(
        {
          db: {} as never,
          fileRepo,
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "file-2", userId: "someone-else" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for an unknown file id", async () => {
    await expect(
      deleteFile(
        {
          db: {} as never,
          fileRepo: makeFakeFileRepo(),
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission(),
        },
        { id: "missing", userId: "user-1" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
