import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { confirmUpload } from "./confirm-upload.js";
import {
  makeFakeDb,
  makeFakeFileRecord,
  makeFakeFindFileById,
  makeFakeHeadObjectS3,
  makeFakeMarkFileUploaded,
} from "./test-fixtures.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

const scope = createOrganizationScope("org-1");

describe("confirmUpload", () => {
  it("persists the size S3 reports, not the declared size", async () => {
    const calls: { id: string; sizeBytes: number | null }[] = [];

    await confirmUpload(
      {
        db: makeFakeDb(),
        s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: 4096 }),
        findFileByIdQuery: makeFakeFindFileById(),
        markFileUploadedCommand: makeFakeMarkFileUploaded((id, sizeBytes) =>
          calls.push({ id, sizeBytes }),
        ),
      },
      { id: "file-1", scope },
    );

    expect(calls).toEqual([{ id: "file-1", sizeBytes: 4096 }]);
  });

  it("leaves the declared size alone when S3 reports no size", async () => {
    const calls: { id: string; sizeBytes: number | null }[] = [];

    await confirmUpload(
      {
        db: makeFakeDb(),
        s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: null }),
        findFileByIdQuery: makeFakeFindFileById(),
        markFileUploadedCommand: makeFakeMarkFileUploaded((id, sizeBytes) =>
          calls.push({ id, sizeBytes }),
        ),
      },
      { id: "file-1", scope },
    );

    expect(calls).toEqual([{ id: "file-1", sizeBytes: null }]);
  });

  it("rejects when the object was never uploaded", async () => {
    await expect(
      confirmUpload(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeHeadObjectS3({ exists: false, sizeBytes: null }),
          findFileByIdQuery: makeFakeFindFileById(),
          markFileUploadedCommand: makeFakeMarkFileUploaded(),
        },
        { id: "file-1", scope },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects when the file row does not exist", async () => {
    await expect(
      confirmUpload(
        {
          db: makeFakeDb(),
          s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: 4096 }),
          findFileByIdQuery: makeFakeFindFileById(null),
          markFileUploadedCommand: makeFakeMarkFileUploaded(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  describe("thumbnails", () => {
    const originalKey = "org/org-1/file-1/photo.png";
    const thumbnailKey = `${originalKey}.thumbnail.jpg`;
    const image = makeFakeFileRecord({ kind: "image", mimeType: "image/png", s3Key: originalKey });

    async function confirmWith(headObject: S3StoragePort["headObject"], file = image) {
      const recorded: boolean[] = [];
      await confirmUpload(
        {
          db: makeFakeDb(),
          s3Storage: { ...makeFakeHeadObjectS3({ exists: true, sizeBytes: 1 }), headObject },
          findFileByIdQuery: makeFakeFindFileById(file),
          markFileUploadedCommand: makeFakeMarkFileUploaded((_id, _size, hasThumbnail) =>
            recorded.push(hasThumbnail),
          ),
        },
        { id: file.id, scope },
      );
      return recorded;
    }

    it("records a thumbnail when the object exists", async () => {
      expect(await confirmWith(async () => ({ exists: true, sizeBytes: 1 }))).toEqual([true]);
    });

    it("records no thumbnail when the object is missing", async () => {
      const recorded = await confirmWith(async (key) => ({
        exists: key === originalKey,
        sizeBytes: 1,
      }));

      expect(recorded).toEqual([false]);
    });

    it("confirms the upload when the thumbnail check throws", async () => {
      const recorded = await confirmWith(async (key) => {
        if (key === thumbnailKey) throw new Error("Forbidden");
        return { exists: true, sizeBytes: 1 };
      });

      expect(recorded).toEqual([false]);
    });

    it("does not check for a thumbnail on audio", async () => {
      const checked: string[] = [];
      const recorded = await confirmWith(async (key) => {
        checked.push(key);
        return { exists: true, sizeBytes: 1 };
      }, makeFakeFileRecord());

      expect(checked).toEqual(["org/org-1/file-1/demo.mp3"]);
      expect(recorded).toEqual([false]);
    });
  });
});
