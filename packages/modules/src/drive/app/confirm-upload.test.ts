import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { confirmUpload } from "./confirm-upload.js";
import {
  makeFakeDb,
  makeFakeFindFileById,
  makeFakeHeadObjectS3,
  makeFakeMarkFileUploaded,
} from "./test-fixtures.js";

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
});
