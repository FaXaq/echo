import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import type { FileRecord } from "@echo/modules/drive/domain";
import type {
  DeleteFileByIdCommandPort,
  ListFilesBySongQueryPort,
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
    songId: "song-1",
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

function makeFakeListFilesBySongQuery(files: FileRecord[]): ListFilesBySongQueryPort {
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
  it("deletes the S3 object and file row for a file attached only to this song", async () => {
    const deletedKeys: string[] = [];
    const deletedFileIds: string[] = [];
    const deleteSongCommand: DeleteSongCommandPort = async () => true;

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        listFilesBySongQuery: makeFakeListFilesBySongQuery([makeFakeFile()]),
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

  it("leaves the S3 object and file row alone when the file is still attached to an event", async () => {
    const deleteObject = vi.fn(async () => {});
    const deleteFileByIdCommand = vi.fn(async () => true);
    const deleteSongCommand: DeleteSongCommandPort = async () => true;

    const failures = await deleteSong(
      {
        db,
        deleteSongCommand,
        listFilesBySongQuery: makeFakeListFilesBySongQuery([makeFakeFile({ eventId: "event-1" })]),
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
          listFilesBySongQuery: makeFakeListFilesBySongQuery([]),
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
        listFilesBySongQuery: makeFakeListFilesBySongQuery([makeFakeFile()]),
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
});
