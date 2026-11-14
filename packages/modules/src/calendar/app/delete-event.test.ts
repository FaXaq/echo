import { describe, expect, it, vi } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import type { DeleteOrphanedFilesCommandPort } from "@echo/modules/drive/infrastructure";
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

const allowed = async () => ({ success: true, error: null, role: null });

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
    const deleteCalendarEventCommand = vi.fn<DeleteCalendarEventCommandPort>(async () => ({
      fileIds: [],
    }));
    const deleteOrphanedFilesCommand = vi.fn<DeleteOrphanedFilesCommandPort>(async () => []);

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
          deleteOrphanedFilesCommand,
          s3Storage: makeFakeS3Storage(),
        },
        { id: "event-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(deleteCalendarEventCommand).not.toHaveBeenCalled();
    expect(deleteOrphanedFilesCommand).not.toHaveBeenCalled();
  });

  it("purges only files the command reports as orphaned after the event is deleted", async () => {
    const calls: string[] = [];
    const deletedKeys: string[] = [];
    const deleteCalendarEventCommand: DeleteCalendarEventCommandPort = async () => {
      calls.push("deleteEvent");
      return { fileIds: ["file-orphan", "file-in-folder"] };
    };
    const deleteOrphanedFilesCommand = vi.fn<DeleteOrphanedFilesCommandPort>(async () => {
      calls.push("purge");
      return [{ id: "file-orphan", s3Key: "org/org-1/file-orphan/a.mp3", mimeType: "audio/mpeg" }];
    });

    const failures = await deleteEvent(
      {
        db,
        userHasPermissionInOrganization: allowed,
        deleteCalendarEventCommand,
        deleteOrphanedFilesCommand,
        s3Storage: makeFakeS3Storage({
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
        }),
      },
      { id: "event-1", scope },
    );

    expect(calls).toEqual(["deleteEvent", "purge"]);
    expect(deleteOrphanedFilesCommand).toHaveBeenCalledWith(db, scope, {
      fileIds: ["file-orphan", "file-in-folder"],
    });
    expect(deletedKeys).toEqual(["org/org-1/file-orphan/a.mp3"]);
    expect(failures).toEqual([]);
  });

  it("throws NotFoundError when the event doesn't exist", async () => {
    const deleteOrphanedFilesCommand = vi.fn<DeleteOrphanedFilesCommandPort>(async () => []);

    await expect(
      deleteEvent(
        {
          db,
          userHasPermissionInOrganization: allowed,
          deleteCalendarEventCommand: async () => null,
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

    const failures = await deleteEvent(
      {
        db,
        userHasPermissionInOrganization: allowed,
        deleteCalendarEventCommand: async () => ({ fileIds: ["file-ok", "file-failing"] }),
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
      { id: "event-1", scope },
    );

    expect(failures).toEqual([{ fileId: "file-failing", error }]);
  });
});
