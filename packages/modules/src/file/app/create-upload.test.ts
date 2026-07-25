import { describe, expect, it } from "vitest";
import { ForbiddenError, ConflictError } from "@echo/errors";
import { createUpload } from "./create-upload.js";
import { makeFakeFileRepo, makeFakeS3Storage, makeFakeUserPermission } from "./test-fixtures.js";

const baseInput = {
  userId: "user-1",
  mimeType: "audio/mpeg",
  sizeBytes: 1024,
  filename: "demo.mp3",
};

describe("createUpload", () => {
  it("creates a pending personal file and returns an upload url", async () => {
    const fileRepo = makeFakeFileRepo();
    const s3Storage = makeFakeS3Storage();
    const userPermission = makeFakeUserPermission();

    const result = await createUpload(
      { db: {} as never, fileRepo, s3Storage, userPermission },
      baseInput,
    );

    expect(result.fileId).toBeTruthy();
    expect(result.uploadUrl).toContain(`personal/${baseInput.userId}/${result.fileId}/demo.mp3`);

    const stored = await fileRepo.findById({} as never, result.fileId);
    expect(stored?.status).toBe("pending");
    expect(stored?.organizationId).toBeNull();
  });

  it("creates a pending organization file when organizationId is given", async () => {
    const fileRepo = makeFakeFileRepo();
    const result = await createUpload(
      {
        db: {} as never,
        fileRepo,
        s3Storage: makeFakeS3Storage(),
        userPermission: makeFakeUserPermission(),
      },
      { ...baseInput, organizationId: "org-1" },
    );

    const stored = await fileRepo.findById({} as never, result.fileId);
    expect(stored?.organizationId).toBe("org-1");
    expect(stored?.s3Key).toContain(`org/org-1/${result.fileId}/demo.mp3`);
  });

  it("rejects an unsupported mime type", async () => {
    await expect(
      createUpload(
        {
          db: {} as never,
          fileRepo: makeFakeFileRepo(),
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission(),
        },
        { ...baseInput, mimeType: "application/pdf" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a file over the size limit", async () => {
    await expect(
      createUpload(
        {
          db: {} as never,
          fileRepo: makeFakeFileRepo(),
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission(),
        },
        { ...baseInput, sizeBytes: 200 * 1024 * 1024 },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a personal upload when the user lacks selfCreate", async () => {
    await expect(
      createUpload(
        {
          db: {} as never,
          fileRepo: makeFakeFileRepo(),
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission({
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
          db: {} as never,
          fileRepo: makeFakeFileRepo(),
          s3Storage: makeFakeS3Storage(),
          userPermission: makeFakeUserPermission({
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
});
