import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { deleteFolder } from "./delete-folder.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakeS3Storage } from "./test-fixtures.js";
import type { DeleteFolderCascadeCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("deleteFolder", () => {
  it("rejects a member without drive:delete permission", async () => {
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => ({
      deletedFiles: [],
    });

    await expect(
      deleteFolder(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeS3Storage(),
          deleteFolderCascadeCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "folder-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the folder doesn't exist in this organization", async () => {
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => null;

    await expect(
      deleteFolder(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeS3Storage(),
          deleteFolderCascadeCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes the S3 objects for every hard-deleted file and reports none failed", async () => {
    const s3Storage = makeFakeS3Storage(["org/org-1/file-1/a.mp3", "org/org-1/file-2/b.mp3"]);
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => ({
      deletedFiles: [
        { id: "file-1", s3Key: "org/org-1/file-1/a.mp3" },
        { id: "file-2", s3Key: "org/org-1/file-2/b.mp3" },
      ],
    });

    const failures = await deleteFolder(
      {
        db: makeFakeDb(),
        s3Storage,
        deleteFolderCascadeCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope },
    );

    expect(failures).toEqual([]);
  });

  it("reports files whose S3 object failed to delete", async () => {
    const s3Storage = makeFakeS3Storage();
    const failingS3Storage = {
      ...s3Storage,
      deleteObject: async (key: string) => {
        throw new Error(`boom: ${key}`);
      },
    };
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => ({
      deletedFiles: [{ id: "file-1", s3Key: "org/org-1/file-1/a.mp3" }],
    });

    const failures = await deleteFolder(
      {
        db: makeFakeDb(),
        s3Storage: failingS3Storage,
        deleteFolderCascadeCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope },
    );

    expect(failures).toEqual([{ fileId: "file-1", error: expect.any(Error) }]);
  });
});
