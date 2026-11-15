import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import type { DeleteOrphanedFilesCommandPort } from "@echo/modules/drive/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { deleteSong } from "./delete-song.js";
import type { DeleteSongCommandPort } from "../infrastructure/delete-song.command.port.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

function makeFakeS3Storage(overrides: Partial<S3StoragePort> = {}): S3StoragePort {
  return {
    createUploadUrl: async () => ({ url: "" }),
    createDownloadUrl: async () => ({ url: "" }),
    headObject: async () => ({ exists: true, sizeBytes: 1 }),
    deleteObject: async () => {},
    ...overrides,
  };
}

describe("deleteSong", () => {
  it("purges only files the command reports as orphaned after the song is deleted", async () => {
    const calls: string[] = [];
    const deletedKeys: string[] = [];
    const deleteSongCommand: DeleteSongCommandPort = async () => {
      calls.push("deleteSong");
      return { fileIds: ["file-orphan", "file-in-folder"] };
    };
    const deleteOrphanedFilesCommand = vi.fn<DeleteOrphanedFilesCommandPort>(async () => {
      calls.push("purge");
      return [{ id: "file-orphan", s3Key: "org/org-1/file-orphan/a.mp3", mimeType: "audio/mpeg" }];
    });

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        deleteOrphanedFilesCommand,
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(calls).toEqual(["deleteSong", "purge"]);
    expect(deleteOrphanedFilesCommand).toHaveBeenCalledWith(db, scope, {
      fileIds: ["file-orphan", "file-in-folder"],
    });
    expect(deletedKeys).toEqual(["org/org-1/file-orphan/a.mp3"]);
    expect(failures).toEqual([]);
  });

  it("throws NotFoundError when the song doesn't exist", async () => {
    const deleteOrphanedFilesCommand = vi.fn<DeleteOrphanedFilesCommandPort>(async () => []);

    await expect(
      deleteSong(
        {
          db,
          deleteSongCommand: async () => null,
          deleteOrphanedFilesCommand,
          s3Storage: makeFakeS3Storage(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(deleteOrphanedFilesCommand).not.toHaveBeenCalled();
  });

  it("reports S3 delete failures per file", async () => {
    const error = new Error("s3 down");

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand: async () => ({ fileIds: ["file-ok", "file-failing"] }),
        deleteOrphanedFilesCommand: async () => [
          { id: "file-ok", s3Key: "org/org-1/file-ok/a.mp3", mimeType: "audio/mpeg" },
          { id: "file-failing", s3Key: "org/org-1/file-failing/b.mp3", mimeType: "audio/mpeg" },
        ],
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            if (key.includes("file-failing")) throw error;
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(failures).toEqual([{ fileId: "file-failing", error }]);
  });
});
