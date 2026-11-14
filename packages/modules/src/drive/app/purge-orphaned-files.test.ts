import { describe, expect, it } from "vitest";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteOrphanedFilesCommandPort } from "../infrastructure/index.js";
import { purgeOrphanedFiles } from "./purge-orphaned-files.js";
import { makeFakeDb, makeFakeS3Storage } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

function makeFakeDeleteOrphanedFiles(
  deleted: Awaited<ReturnType<DeleteOrphanedFilesCommandPort>>,
  onCall?: (fileIds: string[]) => void,
): DeleteOrphanedFilesCommandPort {
  return async (_db, _scope, input) => {
    onCall?.(input.fileIds);
    return deleted;
  };
}

describe("purgeOrphanedFiles", () => {
  it("deletes S3 objects of every file the command deleted", async () => {
    const deletedKeys: string[] = [];
    const s3Storage = {
      ...makeFakeS3Storage(),
      deleteObject: async (key: string) => {
        deletedKeys.push(key);
      },
    };

    const result = await purgeOrphanedFiles(
      {
        db: makeFakeDb(),
        s3Storage,
        deleteOrphanedFilesCommand: makeFakeDeleteOrphanedFiles([
          { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
          { id: "file-2", s3Key: "org/org-1/file-2/b.png", mimeType: "image/png" },
        ]),
      },
      { scope, fileIds: ["file-1", "file-2", "file-3"] },
    );

    expect(deletedKeys.sort()).toEqual([
      "org/org-1/file-1/a.mp3",
      "org/org-1/file-2/b.png",
      "org/org-1/file-2/b.png.thumbnail.jpg",
    ]);
    expect(result).toEqual({ deletedFileIds: ["file-1", "file-2"], failures: [] });
  });

  it("reports an S3 failure per file but still returns it as deleted", async () => {
    const error = new Error("s3 down");
    const s3Storage = {
      ...makeFakeS3Storage(),
      deleteObject: async (key: string) => {
        if (key.includes("file-2")) throw error;
      },
    };

    const result = await purgeOrphanedFiles(
      {
        db: makeFakeDb(),
        s3Storage,
        deleteOrphanedFilesCommand: makeFakeDeleteOrphanedFiles([
          { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
          { id: "file-2", s3Key: "org/org-1/file-2/b.mp3", mimeType: "audio/mpeg" },
        ]),
      },
      { scope, fileIds: ["file-1", "file-2"] },
    );

    expect(result).toEqual({
      deletedFileIds: ["file-1", "file-2"],
      failures: [{ fileId: "file-2", error }],
    });
  });

  it("does nothing when the command deletes nothing", async () => {
    const deletedKeys: string[] = [];
    const s3Storage = {
      ...makeFakeS3Storage(),
      deleteObject: async (key: string) => {
        deletedKeys.push(key);
      },
    };

    const result = await purgeOrphanedFiles(
      { db: makeFakeDb(), s3Storage, deleteOrphanedFilesCommand: makeFakeDeleteOrphanedFiles([]) },
      { scope, fileIds: ["file-1"] },
    );

    expect(deletedKeys).toEqual([]);
    expect(result).toEqual({ deletedFileIds: [], failures: [] });
  });
});
