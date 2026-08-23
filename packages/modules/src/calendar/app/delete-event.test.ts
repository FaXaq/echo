import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import type { FileRecord } from "@echo/modules/drive/domain";
import type { ListFilesByEventQueryPort } from "@echo/modules/drive/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { deleteEvent } from "./delete-event.js";
import type { DeleteCalendarEventCommandPort } from "../infrastructure/delete-calendar-event.command.port.js";

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
    eventId: "event-1",
    eventTitle: null,
    songId: null,
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

function makeFakeListFilesByEventQuery(files: FileRecord[]): ListFilesByEventQueryPort {
  return async () => files;
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

describe("deleteEvent", () => {
  it("throws ForbiddenError when the user lacks permission, without touching files", async () => {
    const deleteObject = vi.fn(async () => {});
    const deleteCalendarEventCommand: DeleteCalendarEventCommandPort = async () => true;

    await expect(
      deleteEvent(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
          deleteCalendarEventCommand,
          listFilesByEventQuery: makeFakeListFilesByEventQuery([]),
          s3Storage: makeFakeS3Storage({ deleteObject }),
        },
        { id: "event-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("deletes S3 objects for attached files before cascading the row delete", async () => {
    const deletedKeys: string[] = [];
    const deleteCalendarEventCommand: DeleteCalendarEventCommandPort = async () => true;

    const failures = await deleteEvent(
      {
        db,
        userHasPermissionInOrganization: async () => ({
          success: true,
          error: null,
          role: null,
        }),
        deleteCalendarEventCommand,
        listFilesByEventQuery: makeFakeListFilesByEventQuery([makeFakeFile()]),
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
        }),
      },
      { id: "event-1", scope },
    );

    expect(deletedKeys).toEqual(["org/org-1/file-1/demo.mp3"]);
    expect(failures).toEqual([]);
  });

  it("throws NotFoundError when the event doesn't exist", async () => {
    const deleteCalendarEventCommand: DeleteCalendarEventCommandPort = async () => false;

    await expect(
      deleteEvent(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: true,
            error: null,
            role: null,
          }),
          deleteCalendarEventCommand,
          listFilesByEventQuery: makeFakeListFilesByEventQuery([]),
          s3Storage: makeFakeS3Storage(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("still cascades the row delete and reports the failure when an S3 delete rejects", async () => {
    let commandCalled = false;
    const deleteCalendarEventCommand: DeleteCalendarEventCommandPort = async () => {
      commandCalled = true;
      return true;
    };
    const error = new Error("s3 down");

    const failures = await deleteEvent(
      {
        db,
        userHasPermissionInOrganization: async () => ({
          success: true,
          error: null,
          role: null,
        }),
        deleteCalendarEventCommand,
        listFilesByEventQuery: makeFakeListFilesByEventQuery([makeFakeFile()]),
        s3Storage: makeFakeS3Storage({
          deleteObject: async () => {
            throw error;
          },
        }),
      },
      { id: "event-1", scope },
    );

    expect(commandCalled).toBe(true);
    expect(failures).toEqual([{ fileId: "file-1", error }]);
  });
});
