import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import type { FileRecord } from "@echo/modules/drive/domain";
import type {
  DeleteFileByIdCommandPort,
  FindOrphanedFilesForSongQueryPort,
} from "@echo/modules/drive/infrastructure";
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

function makeFakeFile(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "file-1",
    eventId: null,
    eventTitle: null,
    folderId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Test User",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 100,
    filename: "demo.mp3",
    originalFilename: "demo.mp3",
    s3Key: "org/org-1/file-1/demo.mp3",
    status: "uploaded",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeFakeFindOrphanedFilesForSongQuery(
  files: FileRecord[],
): FindOrphanedFilesForSongQueryPort {
  return async () => files;
}

function makeFakeDeleteFileByIdCommand(onCall?: (id: string) => void): DeleteFileByIdCommandPort {
  return async (_db, _scope, input) => {
    onCall?.(input.id);
    return true;
  };
}

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
  it("deletes the S3 object and file row for each orphaned file", async () => {
    const deletedKeys: string[] = [];
    const deletedFileIds: string[] = [];
    const deleteSongCommand: DeleteSongCommandPort = async () => true;

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([makeFakeFile()]),
        deleteFileByIdCommand: makeFakeDeleteFileByIdCommand((id) => deletedFileIds.push(id)),
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(deletedKeys).toEqual(["org/org-1/file-1/demo.mp3"]);
    expect(deletedFileIds).toEqual(["file-1"]);
    expect(failures).toEqual([]);
  });

  it("touches no files when none are orphaned", async () => {
    const deleteObject = vi.fn(async () => {});
    const deleteFileByIdCommand = vi.fn(async () => true);
    const deleteSongCommand: DeleteSongCommandPort = async () => true;

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([]),
        deleteFileByIdCommand,
        s3Storage: makeFakeS3Storage({ deleteObject }),
      },
      { id: "song-1", scope },
    );

    expect(deleteObject).not.toHaveBeenCalled();
    expect(deleteFileByIdCommand).not.toHaveBeenCalled();
    expect(failures).toEqual([]);
  });

  it("throws NotFoundError when the song doesn't exist", async () => {
    const deleteSongCommand: DeleteSongCommandPort = async () => false;

    await expect(
      deleteSong(
        {
          db,
          deleteSongCommand,
          findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([]),
          deleteFileByIdCommand: makeFakeDeleteFileByIdCommand(),
          s3Storage: makeFakeS3Storage(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("still deletes the orphaned file row and cascades the song delete when an S3 delete rejects", async () => {
    let commandCalled = false;
    const deleteSongCommand: DeleteSongCommandPort = async () => {
      commandCalled = true;
      return true;
    };
    const deletedFileIds: string[] = [];
    const error = new Error("s3 down");

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([makeFakeFile()]),
        deleteFileByIdCommand: makeFakeDeleteFileByIdCommand((id) => deletedFileIds.push(id)),
        s3Storage: makeFakeS3Storage({
          deleteObject: async () => {
            throw error;
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(commandCalled).toBe(true);
    expect(deletedFileIds).toEqual(["file-1"]);
    expect(failures).toEqual([{ fileId: "file-1", error }]);
  });

  it("deletes the S3 object and file row for a pending, not-yet-confirmed orphaned file", async () => {
    const deletedKeys: string[] = [];
    const deletedFileIds: string[] = [];
    const deleteSongCommand: DeleteSongCommandPort = async () => true;

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([
          makeFakeFile({ status: "pending" }),
        ]),
        deleteFileByIdCommand: makeFakeDeleteFileByIdCommand((id) => deletedFileIds.push(id)),
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(deletedKeys).toEqual(["org/org-1/file-1/demo.mp3"]);
    expect(deletedFileIds).toEqual(["file-1"]);
    expect(failures).toEqual([]);
  });

  it("attributes S3 delete failures to the correct file id among several orphaned files", async () => {
    const deletedKeys: string[] = [];
    const deletedFileIds: string[] = [];
    const deleteSongCommand: DeleteSongCommandPort = async () => true;
    const error = new Error("s3 down");

    const okFile = makeFakeFile({ id: "file-ok", s3Key: "org/org-1/file-ok/a.mp3" });
    const failingFile = makeFakeFile({ id: "file-failing", s3Key: "org/org-1/file-failing/b.mp3" });

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        findOrphanedFilesForSongQuery: makeFakeFindOrphanedFilesForSongQuery([okFile, failingFile]),
        deleteFileByIdCommand: makeFakeDeleteFileByIdCommand((id) => deletedFileIds.push(id)),
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            if (key === failingFile.s3Key) throw error;
            deletedKeys.push(key);
          },
        }),
      },
      { id: "song-1", scope },
    );

    expect(deletedKeys).toEqual([okFile.s3Key]);
    expect(deletedFileIds.sort()).toEqual(["file-failing", "file-ok"]);
    expect(failures).toEqual([{ fileId: "file-failing", error }]);
  });
});
