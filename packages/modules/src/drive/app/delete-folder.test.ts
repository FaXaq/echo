import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { deleteFolder } from "./delete-folder.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakeS3Storage } from "./test-fixtures.js";
import type {
  DeleteFolderCascadeCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

const noOrphans: DeleteOrphanedFilesCommandPort = async () => [];

describe("deleteFolder", () => {
  it("rejects a member without drive:delete permission", async () => {
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => ({
      fileIds: [],
    });

    await expect(
      deleteFolder(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeS3Storage(),
          deleteFolderCascadeCommand,
          deleteOrphanedFilesCommand: noOrphans,
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
          deleteOrphanedFilesCommand: noOrphans,
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("passes every placed file id from the cascade to purge", async () => {
    const calls: string[] = [];
    const purged: string[][] = [];
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => {
      calls.push("cascade");
      return { fileIds: ["file-1", "file-2"] };
    };
    const deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort = async (_db, _s, input) => {
      calls.push("purge");
      purged.push(input.fileIds);
      return [{ id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" }];
    };

    const failures = await deleteFolder(
      {
        db: makeFakeDb(),
        s3Storage: makeFakeS3Storage(),
        deleteFolderCascadeCommand,
        deleteOrphanedFilesCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope },
    );

    expect(calls).toEqual(["cascade", "purge"]);
    expect(purged).toEqual([["file-1", "file-2"]]);
    expect(failures).toEqual([]);
  });

  it("reports files whose S3 object failed to delete", async () => {
    const failingS3Storage = {
      ...makeFakeS3Storage(),
      deleteObject: async (key: string) => {
        throw new Error(`boom: ${key}`);
      },
    };
    const deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort = async () => ({
      fileIds: ["file-1"],
    });
    const deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort = async () => [
      { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
    ];

    const failures = await deleteFolder(
      {
        db: makeFakeDb(),
        s3Storage: failingS3Storage,
        deleteFolderCascadeCommand,
        deleteOrphanedFilesCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope },
    );

    expect(failures).toEqual([{ fileId: "file-1", error: expect.any(Error) }]);
  });
});
