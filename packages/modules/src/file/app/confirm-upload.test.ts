import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@echo/errors";
import { confirmUpload } from "./confirm-upload.js";
import {
  makeFakeFindFileById,
  makeFakeHeadObjectS3,
  makeFakeMarkFileUploaded,
} from "./test-fixtures.js";

describe("confirmUpload", () => {
  it("persists the size S3 reports, not the declared size", async () => {
    const calls: { id: string; sizeBytes: number | null }[] = [];

    await confirmUpload(
      {
        s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: 4096 }),
        findFileById: makeFakeFindFileById(),
        markFileUploaded: makeFakeMarkFileUploaded((id, sizeBytes) =>
          calls.push({ id, sizeBytes }),
        ),
      },
      { id: "file-1" },
    );

    expect(calls).toEqual([{ id: "file-1", sizeBytes: 4096 }]);
  });

  it("leaves the declared size alone when S3 reports no size", async () => {
    const calls: { id: string; sizeBytes: number | null }[] = [];

    await confirmUpload(
      {
        s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: null }),
        findFileById: makeFakeFindFileById(),
        markFileUploaded: makeFakeMarkFileUploaded((id, sizeBytes) =>
          calls.push({ id, sizeBytes }),
        ),
      },
      { id: "file-1" },
    );

    expect(calls).toEqual([{ id: "file-1", sizeBytes: null }]);
  });

  it("rejects when the object was never uploaded", async () => {
    await expect(
      confirmUpload(
        {
          s3Storage: makeFakeHeadObjectS3({ exists: false, sizeBytes: null }),
          findFileById: makeFakeFindFileById(),
          markFileUploaded: makeFakeMarkFileUploaded(),
        },
        { id: "file-1" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects when the file row does not exist", async () => {
    await expect(
      confirmUpload(
        {
          s3Storage: makeFakeHeadObjectS3({ exists: true, sizeBytes: 4096 }),
          findFileById: makeFakeFindFileById(null),
          markFileUploaded: makeFakeMarkFileUploaded(),
        },
        { id: "missing" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
